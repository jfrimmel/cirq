//! Rendering-related stuff.
use winit::dpi::PhysicalSize;
use winit::platform::web::WindowExtWebSys;
use winit::window::Window;

use crate::dom;

/// The renderer for the dynamic view.
pub struct Renderer {
    /// The window to draw onto. This is a `<canvas>` element.
    window: Window,
    /// The rendering context used for drawing something onto the window/canvas.
    context: web_sys::CanvasRenderingContext2d,
    /// The current inner size in pixels.
    ///
    /// Since the canvas is pixel-based, it is important to know the current
    /// size in order to render properly (without using CSS to scale it, which
    /// would introduce artifacts).
    size: PhysicalSize<u32>,
}
impl Renderer {
    /// Create a new [`Renderer`], which renders onto the given [`Window`].
    pub fn new(window: Window) -> Self {
        let canvas = window.canvas().expect("canvas was attached to window");
        let context = dom::rendering_context(&canvas);
        let size = PhysicalSize::new(canvas.width(), canvas.height());

        Self {
            window,
            context,
            size,
        }
    }

    /// Event handler, that should be called, once the window/canvas is resized.
    ///
    /// This is necessary to properly track the dimensions of the drawing target
    /// internally. Not calling this function will result in drawing to the
    /// wrong size, meaning either not using all of the space or drawing outside
    /// of the viewing space.
    ///
    /// Note, that changing the size of the canvas invalidates its contents, so
    /// that they vanish in most clients. Therefore this automatically issues a
    /// redraw.
    pub fn resize(&mut self, size: PhysicalSize<u32>) {
        self.size = size;
        self.window.request_redraw();
    }

    /// Update the canvas content by redrawing everything.
    pub fn render(&self) {
        let width = self.size.width.into();
        let height = self.size.height.into();

        self.context.begin_path();
        self.context.fill_rect(0.0, 0.0, width, height);
        self.context.set_fill_style(&"green".to_owned().into());

        self.context.set_line_width(5.);
        self.context.move_to(0.0, 0.0);
        self.context.line_to(width, height);
        self.context.move_to(width, 0.0);
        self.context.line_to(0.0, height);
        self.context.stroke();
    }
}
