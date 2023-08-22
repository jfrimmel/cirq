use std::panic;
use wasm_bindgen::prelude::*;
use winit::platform::web::{EventLoopExtWebSys, WindowBuilderExtWebSys};

mod dom;
mod renderer;

#[wasm_bindgen(start)]
pub fn main() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let canvas = dom::create_canvas().expect("cannot create the rendering canvas");

    let event_loop = winit::event_loop::EventLoop::new().unwrap();
    let window = winit::window::WindowBuilder::new()
        .with_canvas(Some(canvas))
        .build(&event_loop)
        .expect("cannot create window");

    let mut renderer = renderer::Renderer::new(window);
    event_loop.spawn(move |event, _, control_flow| {
        web_sys::console::debug_1(&format!("event: {event:?}").into());
        control_flow.set_wait();
        match event {
            winit::event::Event::RedrawRequested(_) => renderer.render(),
            winit::event::Event::WindowEvent {
                event: winit::event::WindowEvent::Resized(size),
                ..
            } => renderer.resize(size),
            _ => {}
        }
    });
}
