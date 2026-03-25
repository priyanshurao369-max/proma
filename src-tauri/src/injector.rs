use enigo::{Enigo, KeyboardControllable};

pub fn erase_chars(count: usize) {
  let mut enigo = Enigo::new();
  for _ in 0..count {
    enigo.key_click(enigo::Key::Backspace);
  }
}

pub fn type_string(text: &str) {
  let mut enigo = Enigo::new();
  enigo.key_sequence(text);
}

