//! Functions related to the DOM-access for the rendering.
//!
//! This module, of course, can only be used on the "web" target and exposes the
//! functions for creating and inserting the `<canvas>`-element as well as
//! obtaining the rendering context.
use wasm_bindgen::{prelude::Closure, JsCast};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
use web_sys::{ResizeObserver, ResizeObserverEntry, ResizeObserverSize};

/// An error occurred, that prevents creating the canvas.
///
/// The application cannot proceed in this case.
#[derive(Debug)]
pub struct Error(()); // TODO: store the error causes for reporting

/// Create a rendering surface canvas and insert it into the DOM.
pub fn create_canvas() -> Result<HtmlCanvasElement, Error> {
    let window = web_sys::window().ok_or(Error(()))?;
    let document = window.document().ok_or(Error(()))?;
    let body = document.body().ok_or(Error(()))?;

    let canvas = document
        .create_element("canvas")
        .expect("<canvas> is a supported name")
        .dyn_into::<HtmlCanvasElement>()
        .expect("<canvas> is convertible to `HtmlCanvasElement`");

    // put the canvas rendering surface into a container to allow styling it
    let container = document
        .create_element("div")
        .expect("<div> is a supported name");
    container.set_id("renderer");
    container
        .append_child(&canvas)
        .expect("insertion should be valid");

    // make sure, that the canvas is resized, if the parent container has
    // changed dimensions. This way, the canvas gets resized which is internally
    // listed to by `winit`, which in turn provides a `WindowEvent::Resized`
    // event to pass this to the user code.
    let on_resize = {
        let canvas = canvas.clone();
        move |entries: js_sys::Array| {
            let entry: ResizeObserverEntry = entries.get(0).unchecked_into();
            let size: ResizeObserverSize = entry
                .device_pixel_content_box_size()
                .get(0)
                .unchecked_into();
            let width = size.inline_size() as u32;
            let height = size.block_size() as u32;

            canvas.set_width(width);
            canvas.set_height(height);
        }
    };
    let on_resize = Closure::<dyn Fn(_)>::new(on_resize);
    let observer = ResizeObserver::new(on_resize.into_js_value().unchecked_ref()).unwrap();
    observer.observe(&container);

    body.append_child(&container)
        .expect("insertion should be valid");
    Ok(canvas)
}

/// Obtain the rendering context of a given canvas.
///
/// This always selects the standard 2D rendering context (i.e. no WebGL and
/// no WGPU).
pub fn rendering_context(canvas: &HtmlCanvasElement) -> CanvasRenderingContext2d {
    canvas
        .get_context("2d")
        .expect("2d is a valid rendering context and is the only type used")
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>()
        .expect("2D-rendering yields a 2D canvas rendering context")
}
