//! Functions related to the DOM-access for the rendering.
//!
//! This module, of course, can only be used on the "web" target and exposes the
//! functions for creating and inserting the `<canvas>`-element as well as
//! obtaining the rendering context.
use wasm_bindgen::{prelude::Closure, JsCast};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

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

    body.append_child(&container)
        .expect("insertion should be valid");
    Ok(canvas)
}
