import sys
import json
import time
from typing import Dict, Any, List


# ========= LIST-BASED MATH HELPERS =========

def math_sum(values: List[float]) -> float:
    return sum(values)


def math_product(values: List[float]) -> float:
    result = 1
    for v in values:
        result *= v
    return result


def math_average(values: List[float]) -> float:
    if not values:
        return 0
    return sum(values) / len(values)


def math_min(values: List[float]) -> float:
    if not values:
        return 0
    return min(values)


def math_max(values: List[float]) -> float:
    if not values:
        return 0
    return max(values)


def math_subtract(values: List[float]) -> float:
    if not values:
        return 0
    if len(values) == 1:
        return values[0]
    result = values[0]
    for v in values[1:]:
        result -= v
    return result


def math_divide(values: List[float]) -> Dict[str, Any]:
    if not values:
        return {"status": "error", "error": "No values provided for division"}
    if len(values) == 1:
        return {"status": "ok", "result": values[0]}

    result = values[0]
    for v in values[1:]:
        if v == 0:
            return {"status": "error", "error": "Division by zero"}
        result /= v

    return {"status": "ok", "result": result}


def handle_list_math(task_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    values = data.get("inputs", [])

    # Normalize to float list
    try:
        values = [float(v) for v in values]
    except Exception:
        return {
            "status": "error",
            "error": "Inputs must be numeric"
        }

    if task_name == "math.sum":
        result = math_sum(values)
        op = "sum"
    elif task_name == "math.product":
        result = math_product(values)
        op = "product"
    elif task_name == "math.average":
        result = math_average(values)
        op = "average"
    elif task_name == "math.min":
        result = math_min(values)
        op = "min"
    elif task_name == "math.max":
        result = math_max(values)
        op = "max"
    elif task_name == "math.subtract":
        result = math_subtract(values)
        op = "subtract"
    elif task_name == "math.divide":
        div_result = math_divide(values)
        if div_result.get("status") == "error":
            return {
                "status": "error",
                "operation": "divide",
                "error": div_result["error"]
            }
        result = div_result["result"]
        op = "divide"
    else:
        return {
            "status": "error",
            "error": f"Unknown math task_name: {task_name}"
        }

    return {
        "status": "ok",
        "kind": "list",
        "operation": op,
        "inputs": values,
        "result": result,
        "executed_by": "python-adapter"
    }


# ========= CALCULATOR (a, b, op) =========

def handle_calculator_task(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculator-style task:
    {
        "task_name": "calc.binary",
        "data": {
            "op": "add" | "sub" | "mul" | "div" | "mod" | "pow",
            "a": 10,
            "b": 20
        }
    }
    """
    op = data.get("op")
    a = data.get("a")
    b = data.get("b")

    try:
        a = float(a)
        b = float(b)
    except Exception:
        return {
            "status": "error",
            "error": "Calculator inputs a and b must be numeric"
        }

    if op in ("add", "+"):
        result = a + b
    elif op in ("sub", "-"):
        result = a - b
    elif op in ("mul", "*", "x"):
        result = a * b
    elif op in ("div", "/", "÷"):
        if b == 0:
            return {
                "status": "error",
                "error": "Division by zero"
            }
        result = a / b
    elif op in ("mod", "%"):
        if b == 0:
            return {
                "status": "error",
                "error": "Modulo by zero"
            }
        result = a % b
    elif op in ("pow", "^"):
        result = a ** b
    else:
        return {
            "status": "error",
            "error": f"Unknown calculator operator: {op}"
        }

    return {
        "status": "ok",
        "kind": "calc",
        "operation": "calculator",
        "op": op,
        "a": a,
        "b": b,
        "result": result,
        "executed_by": "python-adapter"
    }


# ========= MAIN TASK ROUTER =========

def handle_task(udm: Dict[str, Any]) -> Dict[str, Any]:
    start_time = time.time()
    
    task_name = udm.get("task_name")
    data = udm.get("data", {})

    response = {}

    # list math
    if task_name and task_name.startswith("math."):
        response = handle_list_math(task_name, data)
    # calculator mode
    elif task_name == "calc.binary":
        response = handle_calculator_task(data)
    else:
        response = {
            "status": "error",
            "error": f"Unknown task_name: {task_name}"
        }

    # Add v3 metadata
    duration_ms = (time.time() - start_time) * 1000
    
    # Ensure standard fields
    if "executed_by" not in response:
        response["executed_by"] = "python-adapter"
    
    response["meta"] = {
        "duration_ms": round(duration_ms, 2),
        "adapter_version": "3.0.0"
    }
    
    return response


def main():
    # IMPORTANT: log to stderr, JSON to stdout
    print("[PYTHON ADAPTER] Started and waiting for tasks...", file=sys.stderr, flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            udm = json.loads(line)
        except json.JSONDecodeError as e:
            print(json.dumps({
                "status": "error",
                "error": f"Invalid JSON: {e}"
            }), flush=True)
            continue

        response = handle_task(udm)
        print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()
