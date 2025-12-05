mod routing_engine;

pub use routing_engine::*;

// Entry point for Rust library
#[cfg(feature = "napi")]
#[napi_derive::napi]
fn init() {
    // Initialize Rust-side resources
    println!("[Rust Core] Unikernal v8 Rust accelerated core initialized");
}
