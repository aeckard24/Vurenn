"""
app/vurenn.py — Core assistant logic, preserved from Server.py.

This keeps Server.py's actual assistant behavior (local fast-path handlers
for math, dictionary, time/date, YouTube, Spotify, plus Claude for
everything else, including the Christian-advice system prompt), but strips
out everything specific to the old Flask voice app: no TTS/STT, no MFA, no
face recognition, no Stripe/billing. Per the current spec (item 9), those
are intentionally out of scope for this launch pass — they can be
reintroduced later on top of this same core module.

The only outside model provider this code calls is Anthropic's Claude API,
via the `anthropic` Python SDK. It requires the ANTHROPIC_API_KEY
environment variable — see confirm_provider() below.
"""

import os
import re
import time
from datetime import datetime
from typing import Generator, List, Dict, Optional

import requests
from anthropic import Anthropic

try:
    import sympy as sp
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False

try:
    import spotipy
    from spotipy.oauth2 import SpotifyOAuth
    SPOTIFY_AVAILABLE = True
except ImportError:
    SPOTIFY_AVAILABLE = False

# ─── Configuration (all from environment variables) ───────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")

SPOTIFY_CLIENT_ID     = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REDIRECT_URI  = os.environ.get("SPOTIFY_REDIRECT_URI", "http://localhost:8888/callback")
SPOTIFY_SCOPES = (
    "user-read-playback-state user-modify-playback-state "
    "user-read-currently-playing playlist-read-private streaming"
)


def confirm_provider() -> Dict[str, object]:
    """
    Confirms whether this code calls an outside model provider, and which
    environment variable it needs. Answer: yes — Anthropic's Claude API,
    via ANTHROPIC_API_KEY. Nothing else here calls a paid/outside model.
    """
    return {
        "provider": "anthropic",
        "required_env_var": "ANTHROPIC_API_KEY",
        "configured": bool(ANTHROPIC_API_KEY),
        "model": CLAUDE_MODEL,
    }


claude = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

SYSTEM_PROMPT = """You are Vurenn, a friendly and intelligent assistant.
Give thorough, well-reasoned answers — don't artificially cut things short.
For simple factual questions, a sentence or two is fine. For anything that
benefits from explanation, context, or multiple points, take the space you need.
You are helpful, honest, and warm.

When the user asks for advice, guidance, or how to handle a life situation
(relationships, decisions, struggles, moral questions, etc.), offer counsel
grounded in a Christian worldview — drawing on biblical principles and, where
relevant, referencing specific scripture (name the book/chapter/verse when you
quote or paraphrase one). Keep it warm and practical, not preachy. If the
user's question is purely factual or technical, just answer it directly."""


def stream_claude_response(message: str, history: Optional[List[Dict[str, str]]] = None) -> Generator[str, None, None]:
    """Streams a Claude response as plain-text chunks."""
    if not claude:
        yield "Claude API key not configured. Please set the ANTHROPIC_API_KEY environment variable."
        return

    messages = list(history or [])
    messages.append({"role": "user", "content": message})

    try:
        with claude.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"I had trouble connecting to my brain. Error: {e}"


# ─── Spotify Client ──────────────────────────────────────────────────────────

sp_client = None


def init_spotify():
    global sp_client
    if not SPOTIFY_AVAILABLE or not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        return
    try:
        sp_client = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI, scope=SPOTIFY_SCOPES, open_browser=False,
        ))
        sp_client.current_user()
    except Exception as e:
        print(f"[Vurenn] Spotify auth failed: {e}")
        sp_client = None


def _active_device():
    try:
        devices = sp_client.devices().get("devices", [])
        active = [d for d in devices if d["is_active"]]
        if active:
            return active[0]["id"]
        if devices:
            return devices[0]["id"]
    except Exception:
        pass
    return None


def handle_spotify(command: str) -> Optional[str]:
    if not sp_client:
        return None
    cmd = command.lower().strip()

    if re.search(r"what(?:'s| is)(?: currently)? playing|now playing", cmd):
        try:
            current = sp_client.current_playback()
            if current and current.get("item"):
                t = current["item"]; a = t["artists"][0]["name"]
                state = "playing" if current["is_playing"] else "paused"
                return f"Currently {state}: {t['name']} by {a}."
            return "Nothing is playing right now."
        except Exception as e:
            return f"Couldn't check playback. Error: {e}"

    if re.search(r"\bpause\b|stop music|stop playing", cmd):
        try:
            sp_client.pause_playback(); return "Music paused."
        except Exception as e:
            return f"Couldn't pause. Error: {e}"

    if re.search(r"\bresume\b|continue playing|unpause", cmd):
        try:
            sp_client.start_playback(device_id=_active_device()); return "Resuming music."
        except Exception as e:
            return f"Couldn't resume. Error: {e}"

    if re.search(r"\bskip\b|next song|next track", cmd):
        try:
            sp_client.next_track(); time.sleep(0.5)
            current = sp_client.current_playback()
            if current and current.get("item"):
                t = current["item"]
                return f"Skipped! Now playing {t['name']} by {t['artists'][0]['name']}."
            return "Skipped to next track."
        except Exception as e:
            return f"Couldn't skip. Error: {e}"

    play_match = re.search(r"play\s+(.+?)(?:\s+(?:by|from|on spotify))?$", cmd)
    if play_match or cmd.startswith("play"):
        query = play_match.group(1).strip() if play_match else cmd.replace("play", "").strip()
        if not query:
            return None
        try:
            results = sp_client.search(q=query, limit=1, type="track,artist,playlist")
            tracks = results.get("tracks", {}).get("items", [])
            if tracks:
                t = tracks[0]
                sp_client.start_playback(device_id=_active_device(), uris=[t["uri"]])
                return f"Playing {t['name']} by {t['artists'][0]['name']}."
            return f"I couldn't find anything for '{query}' on Spotify."
        except Exception as e:
            return f"Spotify error: {e}"

    return None


# ─── Math Handlers ────────────────────────────────────────────────────────────

def clean_math_query(command: str) -> str:
    prefixes = ["what is", "what's", "whats", "calculate", "evaluate", "solve", "find", "work out", "compute", "tell me"]
    command = command.lower().strip()
    for prefix in prefixes:
        if command.startswith(prefix):
            command = command[len(prefix):].strip()
            break
    return command


def convert_natural_language_exponents(command: str) -> str:
    patterns = [
        (r"(\b\d+\.?\d*\b)\s+squared\b", r"\1**2"),
        (r"(\b\d+\.?\d*\b)\s+cubed\b", r"\1**3"),
        (r"(\b\d+\.?\d*\b)\s+to the power of\s+(\b\d+\.?\d*\b)", r"\1**\2"),
        (r"(\b\d+\.?\d*\b)\s*\^\s*(\b\d+\.?\d*\b)", r"\1**\2"),
    ]
    for pattern, replacement in patterns:
        command = re.sub(pattern, replacement, command, flags=re.IGNORECASE)
    return command


def is_math_problem(command: str) -> Optional[str]:
    cleaned = clean_math_query(command)
    cleaned = convert_natural_language_exponents(cleaned)
    pattern = r"^[\d\+\-\*/\^\(\)\.\s=]+$"
    if re.match(pattern, cleaned) and any(c.isdigit() for c in cleaned):
        return cleaned.strip()
    return None


def solve_math_problem(command: str) -> str:
    try:
        expr = clean_math_query(command)
        expr = convert_natural_language_exponents(expr).replace("^", "**")
        expr = re.sub(r"\s+", "", expr)
        if SYMPY_AVAILABLE:
            result = sp.sympify(expr).evalf()
            return str(int(result)) if result.is_integer else f"{float(result):.6f}".rstrip("0").rstrip(".")
        return str(eval(expr))
    except Exception as e:
        return f"I couldn't solve that. Error: {e}"


def is_square_root_problem(command: str) -> Optional[str]:
    command = clean_math_query(command)
    for pattern in [r"square\s+root\s+of\s+(\d+\.?\d*)", r"sqrt\s*\(\s*(\d+\.?\d*)\s*\)"]:
        m = re.search(pattern, command, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


def solve_square_root(number_str: str) -> str:
    try:
        import math
        number = float(number_str)
        if number < 0:
            return f"The square root of {number} is not a real number."
        result = math.sqrt(number)
        return str(int(result)) if result == int(result) else f"{result:.6f}".rstrip("0").rstrip(".")
    except Exception as e:
        return f"Couldn't calculate square root. Error: {e}"


# ─── Dictionary / Time / Date ─────────────────────────────────────────────────

def extract_definition_word(command: str) -> Optional[str]:
    cmd = command.lower().strip()
    if "what is the meaning of" in cmd: return cmd.split("what is the meaning of")[-1].strip()
    if "meaning of" in cmd: return cmd.split("meaning of")[-1].strip()
    if "define" in cmd: return cmd.split("define")[-1].strip()
    if "what does" in cmd and "mean" in cmd: return cmd.split("what does")[-1].split("mean")[0].strip()
    return None


def get_word_definition(word: str) -> str:
    try:
        response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data and isinstance(data, list):
                definitions = []
                for meaning in data[0].get("meanings", [])[:2]:
                    pos = meaning.get("partOfSpeech", "")
                    for defn in meaning.get("definitions", [])[:1]:
                        text = defn.get("definition", "")
                        if pos and text:
                            definitions.append(f"{pos}: {text}")
                if definitions:
                    return f"'{word}' means: " + " | ".join(definitions)
        return f"Sorry, I couldn't find a definition for '{word}'."
    except Exception as e:
        return f"Dictionary lookup failed. Error: {e}"


def get_current_time() -> str:
    return f"It's {datetime.now().strftime('%I:%M %p').lstrip('0')}."


def get_current_date() -> str:
    return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."


# ─── YouTube ──────────────────────────────────────────────────────────────────

def search_youtube(query: str) -> Optional[str]:
    try:
        url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        resp = requests.get(url, headers=headers, timeout=8)
        resp.raise_for_status()
        m = re.search(r'"videoId":"([a-zA-Z0-9_-]{11})"', resp.text)
        return m.group(1) if m else None
    except Exception:
        return None


def extract_video_query(command: str) -> Optional[str]:
    cmd = command.lower().strip()
    for pattern in [
        r"play\s+(.+?)\s+video(?:\s+on\s+youtube)?$",
        r"play\s+(.+?)\s+on\s+youtube$",
        r"watch\s+(.+?)\s+on\s+youtube$",
        r"youtube\s+(.+)$",
    ]:
        m = re.search(pattern, cmd)
        if m:
            return m.group(1).strip()
    return None


def handle_youtube(command: str) -> Optional[str]:
    query = extract_video_query(command)
    if not query:
        return None
    video_id = search_youtube(query)
    if not video_id:
        return f"I couldn't find a video for '{query}'."
    return f"Here's a link: https://www.youtube.com/watch?v={video_id}"


# ─── Local handler router ──────────────────────────────────────────────────────

def get_local_response(command: str) -> Optional[str]:
    """
    Tries each fast local handler in order. Returns a finished string if one
    of them handled the request, or None if it should fall through to Claude.
    """
    cmd = command.lower().strip()

    word = extract_definition_word(cmd)
    if word:
        return get_word_definition(word)

    if re.search(r"\btime\b", cmd):
        return get_current_time()
    if re.search(r"\bdate\b|\btoday\b", cmd):
        return get_current_date()

    result = handle_youtube(cmd)
    if result:
        return result

    result = handle_spotify(cmd)
    if result:
        return result

    sqrt_num = is_square_root_problem(cmd)
    if sqrt_num:
        return solve_square_root(sqrt_num)

    math_expr = is_math_problem(cmd)
    if math_expr:
        return solve_math_problem(math_expr)

    if re.search(r"^(hi|hello|hey)\b", cmd):
        return "Hello! How can I help you?"
    if "how are you" in cmd:
        return "I'm doing great, thanks for asking!"

    return None
