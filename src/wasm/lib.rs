use std::panic;
use wasm_bindgen::prelude::*;
use winit::dpi::PhysicalSize;
use winit::event::Event;
use winit::platform::web::{EventLoopExtWebSys, WindowBuilderExtWebSys, WindowExtWebSys};

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

    let width = 300;
    let height = 150;

    let event_loop = winit::event_loop::EventLoop::new().unwrap();
    let window = winit::window::WindowBuilder::new()
        .with_canvas(Some(canvas))
        .with_inner_size(PhysicalSize::new(width, height))
        .build(&event_loop)
        .expect("cannot create window");
    let canvas = window.canvas().unwrap();

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    event_loop.spawn(move |event, _, control_flow| {
        control_flow.set_wait();
        match event {
            Event::RedrawRequested(_) => {
                context.begin_path();
                context.move_to(0.0, 0.0);
                context.line_to(width.into(), height.into());
                context.move_to(width.into(), 0.0);
                context.line_to(0.0, height.into());
                context.stroke();
            }
            _ => {}
        }
    });
}
