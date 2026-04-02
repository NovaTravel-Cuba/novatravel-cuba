from flask import Flask, render_template_string, request, jsonify
import os

app = Flask(__name__)

# ── Configuración de la agencia ──────────────────────────────────────────────
WHATSAPP_NUMBER = "5351234567"   # ← Cambia al número real de Novatravel
WHATSAPP_MSG    = "Hola, acabo de hacer el test en su web y me interesa planificar mi viaje. ¿Me pueden ayudar?"

# ── Lógica de cualificación (sin BD, sin sesión) ─────────────────────────────
def evaluar_cliente(respuestas: dict) -> dict:
    """
    respuestas = {
      "pasaporte": "si" | "tramitando" | "no",
      "cuando":   "pronto" | "6meses" | "sinplanes",
      "destino":  "definido" | "pensando" | "nodecidido"
    }
    Devuelve {"potencial": bool, "perfil": str, "puntos": int}
    """
    puntos = 0

    # Pasaporte
    p = respuestas.get("pasaporte", "")
    if p == "si":        puntos += 3
    elif p == "tramitando": puntos += 1

    # Urgencia de viaje
    c = respuestas.get("cuando", "")
    if c == "pronto":    puntos += 3
    elif c == "6meses":  puntos += 2

    # Destino definido
    d = respuestas.get("destino", "")
    if d == "definido":  puntos += 3
    elif d == "pensando": puntos += 1

    potencial = puntos >= 5

    # Texto de perfil descriptivo
    if puntos >= 7:
        perfil = "Viajero listo para despegar 🛫"
    elif puntos >= 5:
        perfil = "Cliente con alto potencial ✈️"
    elif puntos >= 3:
        perfil = "Viajero en proceso de planificación 📋"
    else:
        perfil = "Viajero en etapa exploratoria 🌍"

    return {"potencial": potencial, "perfil": perfil, "puntos": puntos}


@app.route("/")
def index():
    with open(os.path.join(os.path.dirname(__file__), "index.html"), encoding="utf-8") as f:
        html = f.read()
    # Inyectar configuración en el HTML
    html = html.replace("__WA_NUMBER__", WHATSAPP_NUMBER)
    html = html.replace("__WA_MSG__", WHATSAPP_MSG)
    return html


@app.route("/evaluar", methods=["POST"])
def evaluar():
    data = request.get_json(force=True)
    resultado = evaluar_cliente(data)
    resultado["wa_url"] = (
        f"https://wa.me/{WHATSAPP_NUMBER}"
        f"?text={WHATSAPP_MSG.replace(' ', '%20')}"
    )
    return jsonify(resultado)


if __name__ == "__main__":
    # Puerto 5000, accesible en red local del móvil
    app.run(host="0.0.0.0", port=5000, debug=False)
