from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import webbrowser, threading, os
PORT=8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))
url=f"http://localhost:{PORT}"
threading.Timer(1.0, lambda: webbrowser.open(url)).start()
print(f"Padel Arena Manager v11 avviato su {url}")
print("Per fermarlo premi CTRL+C")
ThreadingHTTPServer(("0.0.0.0",PORT),SimpleHTTPRequestHandler).serve_forever()
