Sistem telemetri artinya data dari perangkat (biasanya mikrokontroler seperti Arduino, ESP32, atau PLC) dikirim secara otomatis dan periodik ke server pusat (backend) melalui jaringan internet (GSM, LoRaWAN, WiFi, dsb).

Jadi:
➡️ Perangkat sensor (di lapangan) membaca data (contohnya: tinggi muka air, curah hujan, baterai, sinyal, dsb).
➡️ Lalu mengirimkan POST request ke endpoint kamu (seperti /telemetry yang sudah kamu buat).
➡️ Server kamu menyimpan data ke database, dan bisa kamu tampilkan di dashboard secara realtime.

⚙️ Jadi, siapa yang mengirim data ke endpoint /telemetry?

✅ Bukan server kamu.
❌ Bukan cronjob dari backend kamu.
✅ Tapi perangkat sensor di lapangan.

Perangkat ini biasanya dilengkapi modul komunikasi seperti:

GSM/GPRS (misal SIM800L, SIM7600, Quectel EC25)

LoRa Gateway

Modem 4G/5G

Atau WiFi

dan di dalamnya ada firmware (program C/C++/Python) yang melakukan hal seperti ini:

Jadi bisa dikatakan: perangkat itu menjalankan semacam cronjob internal sendiri (di firmware-nya), misal setiap 1 menit, 5 menit, atau 15 menit sekali.