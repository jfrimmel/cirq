use std::{panic, rc::Rc};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let window = web_sys::window().expect("Failed to get `window`");
    let document = window.document().expect("Failed to get `document`");

    let canvas = document
        .create_element("canvas")
        .expect("<canvas> is a supported name")
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .expect("`rendering-surface` must be a <canvas>");
    document.body().unwrap().append_child(&canvas).unwrap();

    let canvas = Rc::new(canvas);
    let window = Rc::new(window);

    let on_resize: Closure<dyn Fn()> = Closure::new({
        let window = Rc::clone(&window);
        let canvas = Rc::clone(&canvas);
        move || draw(&window, &canvas)
    });
    window.set_onresize(Some(on_resize.into_js_value().unchecked_ref()));

    draw(&window, &canvas);
}

fn draw(window: &web_sys::Window, canvas: &web_sys::HtmlCanvasElement) {
    let width = window.inner_width().unwrap().as_f64().unwrap().round() as u32;
    let height = window.inner_height().unwrap().as_f64().unwrap().round() as u32;

    canvas.set_width(width);
    canvas.set_height(height);

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    context.begin_path();
    context.move_to(0.0, 0.0);
    context.line_to(width as f64, height as f64);
    context.move_to(0.0, height as f64);
    context.line_to(width as f64, 0.0);
    context.stroke();
}
