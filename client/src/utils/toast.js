import Toastify from "toastify-js";

export function showErrorToast(message) {
  Toastify({
    text: message || "Oops, something went wrong",
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: "#eb4242",
    },
  }).showToast();
}

export function showSuccessToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    newWindow: true,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: "#22c55e",
    },
  }).showToast();
}
