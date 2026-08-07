# TradeX Tanıtım Sitesi

## Yerelde çalıştırma
```bash
npm install
ADMIN_USER=admin ADMIN_PASS=guvenli-bir-sifre npm start
```
Site: http://localhost:3000
Admin paneli: http://localhost:3000/admin (kullanıcı adı/şifre yukarıdaki env değişkenleri)

## Railway'e deploy
1. Bu klasörü bir GitHub reposuna push edin (mevcut bridge sunucunuzla aynı akış).
2. Railway'de "New Project" → "Deploy from GitHub repo".
3. Railway ortam değişkenlerine (Variables) ekleyin:
   - `ADMIN_USER` — admin paneli kullanıcı adı
   - `ADMIN_PASS` — admin paneli şifresi (mutlaka değiştirin, varsayılan `changeme`'dir)
4. Deploy sonrası verilen domain'de site açılır, `/admin` yolunda başvuru paneli gelir.

## Önemli notlar
- Başvurular `data/leads.json` dosyasına yazılır. Railway'de kalıcı disk (volume) bağlamazsanız,
  her yeni deploy'da bu dosya sıfırlanabilir — Railway "Volumes" özelliğinden `/app/data`
  klasörüne kalıcı depolama bağlamanız önerilir.
- `/admin` ve `/admin/export.csv` HTTP Basic Auth ile korunur; tarayıcı kullanıcı adı/şifre soracaktır.
- CSV export butonu ile başvuruları indirip Excel'de açabilirsiniz.
- Bu kurulum küçük/orta hacimli başvuru trafiği için yeterlidir. Yoğun trafik beklerseniz
  gerçek bir veritabanına (Postgres/Firestore) geçmek daha sağlıklı olur.
