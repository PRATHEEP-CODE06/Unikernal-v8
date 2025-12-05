// Unikernal v8 - Rust Accelerated Routing Engine
// This is a Rust module that provides high-performance routing

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    pub source: String,
    pub target: String,
    pub payload: serde_json::Value,
    pub meta: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RouteResult {
    pub success: bool,
    pub adapter_id: Option<String>,
    pub error: Option<String>,
    pub latency_us: u64,
}

pub struct RustRoutingEngine {
    routes: HashMap<String, Vec<String>>, // target -> adapter_ids
    metrics: HashMap<String, RouteMetrics>,
}

#[derive(Clone)]
struct RouteMetrics {
    total_requests: u64,
    errors: u64,
    avg_latency_us: u64,
}

impl RustRoutingEngine {
    pub fn new() -> Self {
        RustRoutingEngine {
            routes: HashMap::new(),
            metrics: HashMap::new(),
        }
    }

    pub fn register_route(&mut self, target: &str, adapter_id: &str) {
        self.routes
            .entry(target.to_string())
            .or_insert_with(Vec::new)
            .push(adapter_id.to_string());
    }

    pub fn route(&mut self, message: &Message) -> RouteResult {
        let start = std::time::Instant::now();

        if let Some(adapters) = self.routes.get(&message.target) {
            if adapters.is_empty() {
                return RouteResult {
                    success: false,
                    adapter_id: None,
                    error: Some("No adapters available".to_string()),
                    latency_us: start.elapsed().as_micros() as u64,
                };
            }

            // Select best adapter (round-robin for now, ML-based in future)
            let adapter_id = &adapters[0];

            // Update metrics
            self.update_metrics(adapter_id, true, start.elapsed().as_micros() as u64);

            RouteResult {
                success: true,
                adapter_id: Some(adapter_id.clone()),
                error: None,
                latency_us: start.elapsed().as_micros() as u64,
            }
        } else {
            RouteResult {
                success: false,
                adapter_id: None,
                error: Some(format!("Target '{}' not found", message.target)),
                latency_us: start.elapsed().as_micros() as u64,
            }
        }
    }

    fn update_metrics(&mut self, adapter_id: &str, success: bool, latency_us: u64) {
        let metrics = self.metrics
            .entry(adapter_id.to_string())
            .or_insert(RouteMetrics {
                total_requests: 0,
                errors: 0,
                avg_latency_us: 0,
            });

        metrics.total_requests += 1;
        if !success {
            metrics.errors += 1;
        }
        
        // Running average
        metrics.avg_latency_us = 
            (metrics.avg_latency_us * (metrics.total_requests - 1) + latency_us) 
            / metrics.total_requests;
    }

    pub fn get_metrics(&self) -> HashMap<String, (u64, u64, u64)> {
        self.metrics
            .iter()
            .map(|(k, v)| (k.clone(), (v.total_requests, v.errors, v.avg_latency_us)))
            .collect()
    }
}

// FFI exports for Node.js
#[cfg(feature = "napi")]
mod napi_exports {
    use super::*;
    use napi::bindgen_prelude::*;
    use napi_derive::napi;

    #[napi]
    pub struct RoutingEngine {
        inner: RustRoutingEngine,
    }

    #[napi]
    impl RoutingEngine {
        #[napi(constructor)]
        pub fn new() -> Self {
            RoutingEngine {
                inner: RustRoutingEngine::new(),
            }
        }

        #[napi]
        pub fn register_route(&mut self, target: String, adapter_id: String) {
            self.inner.register_route(&target, &adapter_id);
        }

        #[napi]
        pub fn route(&mut self, message_json: String) -> String {
            let message: Message = serde_json::from_str(&message_json).unwrap();
            let result = self.inner.route(&message);
            serde_json::to_string(&result).unwrap()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routing() {
        let mut engine = RustRoutingEngine::new();
        engine.register_route("test-service", "adapter-1");

        let msg = Message {
            source: "client".to_string(),
            target: "test-service".to_string(),
            payload: serde_json::json!({"test": true}),
            meta: None,
        };

        let result = engine.route(&msg);
        assert!(result.success);
        assert_eq!(result.adapter_id.unwrap(), "adapter-1");
        assert!(result.latency_us < 1000); // < 1ms
    }
}
