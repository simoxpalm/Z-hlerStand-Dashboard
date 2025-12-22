import gspread

def berechnung_mehrverbrauch():
    print("--- 📊 Analyse: Mehrverbrauch ---")
    try:
        gc = gspread.service_account(filename='dein-schluessel.json')
        sh = gc.open("Zählerstand VScode")
        worksheet = sh.get_worksheet(0)

        # Daten aus Spalte E (Stand) holen
        staende_raw = worksheet.col_values(5)
        staende = [float(s.replace(',', '.')) for s in staende_raw if s.replace(',', '.').replace('.', '').isdigit()]

        if len(staende) >= 3:
            # Die letzten drei Stände (z.B. 200, 250, 450)
            stand_ganz_neu = staende[-1]  # 450
            stand_mitte = staende[-2]     # 250
            stand_alt = staende[-3]       # 200

            # 1. Aktueller Zeitraum
            verbrauch_aktuell = stand_ganz_neu - stand_mitte # 200
            # 2. Vorheriger Zeitraum
            verbrauch_vorher = stand_mitte - stand_alt       # 50
            
            # 3. Der MEHRVERBRAUCH (Die Differenz)
            mehrverbrauch = verbrauch_aktuell - verbrauch_vorher # 150

            # In das Sheet schreiben (Spalte H)
            zeile = len(staende_raw)
            worksheet.update_cell(1, 8, "Analyse Mehrverbrauch")
            worksheet.update_cell(zeile, 8, mehrverbrauch)

            print(f"Aktueller Verbrauch: {verbrauch_aktuell}")
            print(f"Vorheriger Verbrauch: {verbrauch_vorher}")
            print(f"✅ Mehrverbrauch von {mehrverbrauch} eingetragen!")
            
        else:
            print("⚠️ Nicht genug Daten für einen Vergleich (mind. 3 Werte nötig).")

    except Exception as e:
        print(f"❌ Fehler: {e}")

if __name__ == "__main__":
    berechnung_mehrverbrauch()