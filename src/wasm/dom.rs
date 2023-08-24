//! Functions related to the DOM-access for the rendering.
//!
//! This module, of course, can only be used on the "web" target and exposes the
//! functions for creating and inserting the `<canvas>`-element as well as
//! obtaining the rendering context.
use std::str::FromStr;

use wasm_bindgen::{prelude::Closure, JsCast};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, Window};
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
            let size = Size::compute(&entry, &window, &canvas);
            canvas.set_width(size.width);
            canvas.set_height(size.height);
        }
    };
    let on_resize = Closure::<dyn Fn(_)>::new(on_resize);
    let observer = ResizeObserver::new(on_resize.into_js_value().unchecked_ref()).unwrap();
    observer.observe(&container);

    body.append_child(&container)
        .expect("insertion should be valid");
    Ok(canvas)
}

/// Helper for correctly computing the size of the canvas (in all orientations).
struct Size {
    /// The computed actual width.
    width: u32,
    /// The computed actual height.
    height: u32,
}
impl Size {
    /// Compute the actual size of the `canvas` element with the information
    /// obtained from the observer entry.
    pub fn compute(
        entry: &ResizeObserverEntry,
        window: &Window,
        canvas: &HtmlCanvasElement,
    ) -> Self {
        let (inline_size, block_size) = Self::raw_sizes(entry);
        let (width, height) = match Self::orientation(window, canvas) {
            Orientation::Horizontal => (inline_size, block_size),
            Orientation::Vertical => (block_size, inline_size),
        };
        Self { width, height }
    }

    /// Returns the raw `inline` and `block` size.
    fn raw_sizes(entry: &ResizeObserverEntry) -> (u32, u32) {
        let size: ResizeObserverSize = entry
            .device_pixel_content_box_size()
            .get(0)
            .unchecked_into();

        // limit to the maximum canvas dimension on most browsers
        let inline_size = (size.inline_size().round() as u32).min(32767);
        let block_size = (size.block_size().round() as u32).min(32767);

        (inline_size, block_size)
    }

    /// Check the orientation of the viewport.
    fn orientation(window: &Window, canvas: &HtmlCanvasElement) -> Orientation {
        // this is essentially a copy of what `winit` does internally
        let writing_mode = window
            .get_computed_style(canvas)
            .expect("Failed to obtain computed style")
            .unwrap()
            .get_property_value("writing-mode")
            .expect("`writing-mode` is a valid CSS property");

        writing_mode.parse().unwrap_or_default()
    }
}

/// The viewport orientation.
#[derive(Debug, Default, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
enum Orientation {
    #[default]
    Horizontal,
    Vertical,
}
impl FromStr for Orientation {
    type Err = ();

    /// Try to parse the `writing-mode` CSS property.
    fn from_str(writing_mode: &str) -> Result<Self, Self::Err> {
        if writing_mode.starts_with("vertical") || writing_mode.starts_with("sideways") {
            Ok(Orientation::Vertical)
        } else if writing_mode.starts_with("horizontal") {
            Ok(Orientation::Horizontal)
        } else {
            Err(())
        }
    }
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
