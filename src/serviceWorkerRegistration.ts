export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("ServiceWorker registration successful");
        })
        .catch((error) => {
          console.error("ServiceWorker registration failed:", error);
        });
    });
  }
}
