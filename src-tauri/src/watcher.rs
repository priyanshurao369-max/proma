use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use rdev::{listen, Event, EventType, Key};

use crate::injector::{erase_chars, type_string};
use crate::types::PromptEntry;

#[derive(Clone)]
pub struct WatcherState {
  pub buffer: String,
  pub key_map: HashMap<String, PromptEntry>,
}

pub fn key_to_char(key: Key) -> Option<char> {
  match key {
    Key::KeyA => Some('a'),
    Key::KeyB => Some('b'),
    Key::KeyC => Some('c'),
    Key::KeyD => Some('d'),
    Key::KeyE => Some('e'),
    Key::KeyF => Some('f'),
    Key::KeyG => Some('g'),
    Key::KeyH => Some('h'),
    Key::KeyI => Some('i'),
    Key::KeyJ => Some('j'),
    Key::KeyK => Some('k'),
    Key::KeyL => Some('l'),
    Key::KeyM => Some('m'),
    Key::KeyN => Some('n'),
    Key::KeyO => Some('o'),
    Key::KeyP => Some('p'),
    Key::KeyQ => Some('q'),
    Key::KeyR => Some('r'),
    Key::KeyS => Some('s'),
    Key::KeyT => Some('t'),
    Key::KeyU => Some('u'),
    Key::KeyV => Some('v'),
    Key::KeyW => Some('w'),
    Key::KeyX => Some('x'),
    Key::KeyY => Some('y'),
    Key::KeyZ => Some('z'),
    Key::Num1 => Some('1'),
    Key::Num2 => Some('2'),
    Key::Num3 => Some('3'),
    Key::Num4 => Some('4'),
    Key::Num5 => Some('5'),
    Key::Num6 => Some('6'),
    Key::Num7 => Some('7'),
    Key::Num8 => Some('8'),
    Key::Num9 => Some('9'),
    Key::Num0 => Some('0'),
    Key::Slash => Some('/'),
    Key::Minus => Some('-'),
    Key::Equal => Some('='),
    Key::Comma => Some(','),
    Key::Dot => Some('.'),
    Key::Space => Some(' '),
    _ => None,
  }
}

pub fn start_watcher(state: Arc<Mutex<WatcherState>>) -> Result<(), String> {
  let res = listen(move |event: Event| {
    on_event(&state, event);
  });
  res.map_err(|e| format!("{:?}", e))
}

fn on_event(state: &Arc<Mutex<WatcherState>>, event: Event) {
  match event.event_type {
    EventType::KeyPress(key) => {
      if key == Key::Backspace {
        if let Ok(mut s) = state.lock() {
          s.buffer.pop();
        }
        return;
      }

      if key == Key::Space || key == Key::Return {
        let (matched, typed_len, trigger_space) = match state.lock() {
          Ok(s) => {
            let trimmed = s.buffer.trim();
            let buf = trimmed.to_lowercase();
            (s.key_map.get(&buf).cloned(), trimmed.len(), key == Key::Space)
          }
          Err(_) => return,
        };

        if let Some(p) = matched {
          thread::spawn(move || {
            erase_chars(typed_len + 1);
            thread::sleep(Duration::from_millis(120));
            if trigger_space {
              type_string(&(p.content + " "));
            } else {
              type_string(&p.content);
              type_string("\n");
            }
          });
        }

        if let Ok(mut s) = state.lock() {
          s.buffer.clear();
        }
        return;
      }

      if let Some(ch) = key_to_char(key) {
        if let Ok(mut s) = state.lock() {
          if s.buffer.len() >= 64 {
            s.buffer.clear();
          }
          if ch != ' ' {
            s.buffer.push(ch);
          }
        }
      }
    }
    _ => {}
  }
}
