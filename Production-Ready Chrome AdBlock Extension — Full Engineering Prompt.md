# Production-Ready Chrome AdBlock Extension — Senior Chrome Extension Engineer Task

Sen kıdemli bir **Chrome Extension / Chromium / Manifest V3 mühendisisin**.

Görevin mevcut repository'yi analiz ederek, mevcut çalışan kodu gereksiz yere bozmadan **production-ready, güvenli, performanslı, modern ve Chrome Web Store'a gönderilebilir kalitede bir Google Chrome AdBlock + Tracker Blocking Extension** geliştirmektir.

Ana hedef:

> Network seviyesinde mümkün olduğunca etkili reklam ve tracker engelleme sağlayan, minimum permission kullanan, Manifest V3 uyumlu, performanslı, güvenli ve sürdürülebilir bir Chrome extension oluştur.

---

# 0. KRİTİK ÇALIŞMA KURALLARI

Bunlar zorunlu kurallardır.

1. Kod yazmaya başlamadan önce mevcut repository'yi tamamen analiz et.
2. Önce dosya yapısını incele.
3. `package.json` dosyasını incele.
4. Mevcut dependency'leri incele.
5. Mevcut build sistemini incele.
6. Mevcut TypeScript/JavaScript yapılandırmasını incele.
7. Mevcut extension manifestini varsa incele.
8. Mevcut çalışan kodu gereksiz yere silme.
9. Mevcut çalışan mimariyi sırf farklı bir teknoloji kullanmak için yeniden yazma.
10. Büyük ve geri dönüşü zor bir mimari değişiklik gerekiyorsa bunu açıkça raporla.
11. Repository'de olmayan dosya veya mimari hakkında varsayım yapma.
12. Repository erişimi yoksa kod üretmeye başlamadan önce bunu belirt.
13. Mevcut teknoloji mantıklıysa onu koru.
14. Yeni dependency eklemeden önce gerçekten gerekli olup olmadığını değerlendir.
15. Native Chrome API mevcutsa üçüncü parti kütüphane yerine native API tercih et.
16. `eval()` kullanma.
17. `new Function()` kullanma.
18. Inline JavaScript kullanma.
19. Remote JavaScript çalıştırma.
20. Runtime'da remote code download/execute etme.
21. Gizli telemetry ekleme.
22. Kullanıcı verilerini harici sunucuya gönderme.
23. Kullanıcı davranışlarını izleme.
24. Analytics/tracking ekleme.
25. Gereksiz permission isteme.
26. Content script kullanarak network-level ad blocking yapma.
27. `webRequestBlocking` kullanma.
28. Network blocking için öncelikli ve temel mekanizma `declarativeNetRequest` olsun.
29. Her engellenen request için `chrome.storage.local.set()` çağırma.
30. Büyük rule listelerini runtime'da sürekli parse etme.
31. Service worker'ı sürekli çalışan background process gibi kullanma.
32. Memory leak oluşturacak event/listener patternleri kullanma.
33. Build veya test başarısızsa bir sonraki aşamaya geçme.
34. Hataları önce düzelt, sonra devam et.
35. Kod tamamlandıktan sonra final security/performance audit yap.

---

# 1. İLK AŞAMA — REPOSITORY ANALİZİ

Kod yazmadan önce aşağıdakileri yap.

## İncele

- Directory structure
- `package.json`
- lockfile
- `tsconfig.json`
- bundler/build config
- mevcut `manifest.json`
- source files
- test files
- mevcut assets
- mevcut extension architecture
- mevcut permissions
- mevcut storage sistemi
- mevcut UI
- mevcut service worker/background logic

## Sonuç olarak raporla

Şunları çıkar:

### Current Architecture

- mevcut teknoloji stack'i
- entry points
- build sistemi
- mevcut extension lifecycle
- mevcut storage yaklaşımı
- mevcut UI yaklaşımı

### Problems

- eksik özellikler
- security problemleri
- performance problemleri
- architecture problemleri
- manifest problemleri
- dependency problemleri

### Migration Plan

Mevcut kodu koruyarak nasıl geliştirileceğini belirle.

**Önemli:**

Mevcut kod zaten düzgün bir yapı kullanıyorsa gereksiz yere React/Vue/Svelte gibi framework ekleme.

---

# 2. HEDEF TEKNOLOJİ

Tercih:

- Chrome Extension Manifest V3
- TypeScript
- strict mode
- Native Chrome APIs
- `declarativeNetRequest`
- `chrome.storage.local`
- Service Worker
- HTML/CSS/TypeScript veya mevcut repository'nin uygun UI stack'i

Framework yalnızca gerçekten gerekiyorsa kullanılmalı.

---

# 3. ÖNERİLEN PROJE MİMARİSİ

Mevcut repository farklı bir yapı kullanıyorsa onu körü körüne değiştirme.

Yeni yapı gerekiyorsa aşağıdaki mimariye yakın bir yapı oluştur:

```text
src/
├── background/
│   ├── service-worker.ts
│   ├── message-handler.ts
│   ├── statistics-manager.ts
│   └── whitelist-manager.ts
│
├── popup/
│   ├── popup.html
│   ├── popup.ts
│   ├── popup.css
│   └── components/
│
├── options/
│   ├── options.html
│   ├── options.ts
│   ├── options.css
│   └── components/
│
├── storage/
│   ├── storage.ts
│   ├── schema.ts
│   └── migrations.ts
│
├── blocking/
│   ├── ruleset-manager.ts
│   ├── dynamic-rules.ts
│   ├── whitelist-rules.ts
│   └── rule-types.ts
│
├── statistics/
│   ├── statistics.ts
│   ├── aggregation.ts
│   └── types.ts
│
├── utils/
│   ├── domain.ts
│   ├── validation.ts
│   ├── constants.ts
│   └── errors.ts
│
├── types/
│   └── chrome.d.ts
│
└── manifest.json

rules/
├── ads/
│   ├── base.json
│   └── networks.json
│
├── trackers/
│   ├── analytics.json
│   ├── tracking.json
│   └── telemetry.json
│
└── sites/
    └── site-specific.json

public/
└── icons/

tests/
├── blocking/
├── storage/
├── whitelist/
├── statistics/
└── rules/

scripts/
├── validate-rules.ts
├── build-rules.ts
└── audit.ts

README.md
package.json
tsconfig.json
```

---

# 4. MANIFEST V3

Manifest V3 kullan.

Manifest mümkün olduğunca minimal olsun.

Temel yaklaşım:

```json
{
  "manifest_version": 3,
  "name": "...",
  "version": "...",
  "description": "...",
  "permissions": [
    "storage",
    "declarativeNetRequest"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "..."
  },
  "action": {
    "default_popup": "..."
  },
  "options_page": "..."
}
```

Ancak permission'ları körü körüne kopyalama.

Chrome API gereksinimlerini analiz ederek **minimum gerekli permission setini** belirle.

Eğer `<all_urls>` gerekiyorsa neden gerektiğini README'de açıkla.

Permission istemek için başka bir permission ekleme.

Örneğin aşağıdakileri gereksiz yere ekleme:

- tabs
- history
- cookies
- webNavigation
- bookmarks
- downloads
- management
- scripting

Gerçekten gerekmiyorsa kullanılmayacak.

---

# 5. CORE BLOCKING ENGINE

Ana blocking mekanizması:

`chrome.declarativeNetRequest`

olmalıdır.

Network blocking page DOM'una JavaScript inject edilerek yapılmamalıdır.

## Blocking kategorileri

En az:

### Ads

- advertising networks
- ad servers
- ad scripts
- banner resources
- popup resources
- popunder resources
- common video ad endpoints
- tracking-based advertising endpoints

### Trackers

- analytics
- tracking pixels
- fingerprinting endpoints
- telemetry
- behavioral tracking
- known third-party tracking services

---

# 6. RULESET MİMARİSİ

Rules hardcoded TypeScript array içinde tutulmamalı.

Rules ayrı dosyalarda tutulmalı.

Örneğin:

```text
rules/
├── ads/
│   ├── base.json
│   └── networks.json
│
├── trackers/
│   ├── analytics.json
│   ├── tracking.json
│   └── telemetry.json
│
└── sites/
    └── site-specific.json
```

Static ruleset yaklaşımı kullan.

Manifest `rule_resources` üzerinden ruleset'leri tanımla.

Örneğin mantıksal olarak:

```text
ads
trackers
```

ayrı ruleset olabilir.

---

# 7. RULE LIMITLERİ

Chrome `declarativeNetRequest` rule limitlerini dikkate al.

Rule sayısını rastgele büyütme.

Build sistemi:

1. bütün rule dosyalarını oku
2. parse et
3. validate et
4. duplicate ID kontrolü yap
5. invalid rule kontrolü yap
6. toplam rule sayısını hesapla
7. Chrome limitlerine göre kontrol et
8. build başarısızsa hata ver

Rule ID'leri:

- unique
- deterministic
- stable

olmalı.

Aynı rule birden fazla build'de farklı ID almamalı.

---

# 8. STATIC / DYNAMIC / SESSION RULE AYRIMI

Aşağıdaki mimariyi kullan:

### Static Rules

Genel reklam/tracker filtreleri.

Örnek:

```text
ads
trackers
analytics
```

### Dynamic Rules

Kullanıcıya özel kalıcı kurallar.

Örneğin whitelist veya kullanıcı tercihlerinin gerektirdiği dinamik kurallar.

### Session Rules

Geçici durumlar.

Örneğin:

```text
Pause on this website
```

gibi geçici bypass işlemleri için uygunsa session rules kullan.

Bu üç mekanizmayı birbirine karıştırma.

---

# 9. WHITELIST SİSTEMİ

Kullanıcı domain bazında whitelist yapabilmeli.

Örneğin:

```text
example.com
```

whitelist'e alındığında bu domain için blocking devre dışı kalmalı.

## Domain normalization

Şunları doğru normalize et:

```text
https://example.com
http://example.com/
www.example.com
example.com/path
```

hepsi doğru domain representation'a dönüştürülmeli.

## Subdomain davranışı

Açıkça tanımla.

Tercih edilen davranış:

```text
example.com
```

whitelist ise:

```text
example.com
www.example.com
sub.example.com
```

için de blocking bypass edilir.

Bu davranışı test et.

## Security

Kullanıcı girdisini doğrudan rule üretiminde kullanma.

Önce:

- parse
- normalize
- validate
- sanitize

et.

Geçersiz domain reddedilmeli.

---

# 10. PAUSE ON THIS WEBSITE

Whitelist ile pause aynı şey değildir.

### Pause

Geçici durum.

Örneğin:

```text
example.com
```

için kullanıcı:

> Pause on this website

seçtiğinde mevcut site için blocking geçici olarak kapatılır.

### Whitelist

Kalıcı kullanıcı tercihi.

Bu iki state birbirinden ayrı tutulmalı.

Örnek:

```text
pauseState
whitelistState
```

aynı storage alanına anlamsız şekilde karıştırılmamalı.

---

# 11. POPUP UI

Modern ve profesyonel popup oluştur.

Popup Chrome extension popup boyutlarına uygun olmalı.

Minimum:

```text
┌──────────────────────────┐
│ AdBlock             ⚙    │
│                          │
│        [ ON ]            │
│      Protection          │
│                          │
│ example.com              │
│                          │
│ Ads Blocked       1,284  │
│ Trackers Blocked   492   │
│                          │
│ Today             1,776  │
│                          │
│ [ Pause on this site ]   │
│ [ Whitelist site ]       │
└──────────────────────────┘
```

## UI gereksinimleri

- modern
- minimal
- responsive
- dark mode
- light mode
- accessible
- keyboard accessible
- clear visual hierarchy
- no unnecessary animation

CSS:

- inline style kullanma
- external stylesheet kullan
- hardcoded tekrar eden değerleri CSS variables ile yönet

Popup hızlı açılmalı.

Gereksiz network request yapılmamalı.

---

# 12. ACTIVE DOMAIN

Popup mevcut aktif site/domain bilgisini göstermeli.

Örnek:

```text
example.com
```

Kullanıcıya açıkça göster.

System pages için doğru davranış:

```text
chrome://
chrome-extension://
file://
```

gibi sayfalarda blocking kontrolü yapılamıyorsa UI bunu düzgün belirtmeli.

Hata vermemeli.

---

# 13. ON / OFF

Global protection state:

```text
enabled: boolean
```

şeklinde storage'da tutulmalı.

Global OFF olduğunda:

- blocking rules devre dışı bırakılmalı
- UI OFF göstermeli
- mevcut site kontrolleri tutarlı kalmalı

Global ON olduğunda:

- rules tekrar aktif hale gelmeli.

---

# 14. TRACKER BLOCKING

Ayrı toggle:

```text
Ad Blocking
Tracker Blocking
```

olabilir.

Örneğin:

```text
Ad blocking = true
Tracker blocking = true
```

Bu state'lere göre ilgili ruleset'ler etkinleştirilebilir/devre dışı bırakılabilir.

---

# 15. STATISTICS SYSTEM

İstatistik sistemi performans açısından dikkatli tasarlanmalı.

Göster:

- total ads blocked
- total trackers blocked
- today ads blocked
- today trackers blocked
- current site ads blocked
- current site trackers blocked

## KRİTİK

Her request'te:

```ts
chrome.storage.local.set(...)
```

yapma.

Bu performans açısından kötü tasarımdır.

İstatistikleri aggregate et.

Örneğin memory içinde kısa süreli aggregation:

```text
blocked events
      ↓
in-memory counters
      ↓
batch persistence
      ↓
chrome.storage.local
```

Service worker lifecycle'ı nedeniyle veri kaybı kabul edilemez seviyede olmamalı.

Gerekirse daha uygun Chrome API mekanizması kullan.

Storage write frequency optimize edilmeli.

---

# 16. CURRENT SITE STATISTICS

Current site istatistikleri domain bazında tutulabilir.

Örneğin:

```ts
{
  "example.com": {
    "ads": 120,
    "trackers": 45
  }
}
```

Ancak unlimited domain history oluşturma.

Storage büyümesini kontrol et.

Örneğin retention veya maksimum domain sayısı belirle.

Bu limiti merkezi constant olarak tanımla.

---

# 17. DAILY STATISTICS

Günlük istatistikleri:

```text
YYYY-MM-DD
```

formatında tut.

Örneğin:

```text
2026-08-24
```

Timezone davranışını açıkça tanımla.

Kullanıcının local timezone'u esas alınabilir.

Eski istatistikler için retention uygula.

Örneğin son 30 veya 90 gün.

Bu değeri configurable constant yap.

---

# 18. STORAGE

`chrome.storage.local` kullan.

Örneğin:

```text
settings
whitelist
statistics
siteStatistics
pauseState
schemaVersion
```

gibi logical state'ler kullan.

Storage schema version oluştur:

```text
schemaVersion: 1
```

İleride migration yapılabilsin.

Storage'dan gelen veriyi güvenilir kabul etme.

Validation yap.

Corrupted veya eksik storage durumunda güvenli default değer kullan.

---

# 19. OPTIONS PAGE

Ayrı settings/options page oluştur.

İçermeli:

### Protection

- Enable Ad Blocking
- Enable Tracker Blocking

### Whitelist

- whitelist listesi
- add domain
- remove domain
- clear whitelist

### Statistics

- total statistics
- daily statistics
- reset statistics

### Filter Lists

- Ads
- Trackers
- enabled/disabled durumları
- rule count bilgisi

### About

- extension version
- Manifest version
- privacy statement
- open-source/license bilgisi gerekiyorsa

---

# 20. FILTER LIST MANAGEMENT

Kullanıcıya aktif filter categories göster.

Örneğin:

```text
Ads
Trackers
Analytics
```

Filter listelerini runtime'da remote JavaScript olarak indirme.

Remote code execution kesinlikle yasak.

Eğer remote filter list update sistemi uygulanacaksa:

- sadece güvenilir plain-data format
- signature/integrity kontrolü
- strict schema validation
- DNR rule validation
- safe failure
- hiçbir şekilde remote JS execution yok

Ancak ilk production sürümünde mümkünse rule listelerini extension package içerisinde tut.

Bu daha basit ve Web Store açısından daha güvenli.

---

# 21. SECURITY

Aşağıdakiler kesinlikle yasak:

```text
eval()
new Function()
innerHTML ile kontrolsüz kullanıcı girdisi
inline JavaScript
remote script
remote executable code
hidden iframe tracking
telemetry
analytics
user profiling
unnecessary cookies
external data collection
```

DOM manipulation için mümkün olduğunca:

```ts
textContent
createElement
append
replaceChildren
```

gibi güvenli yöntemleri kullan.

Kullanıcı girdisini HTML olarak render etme.

---

# 22. CSP

Manifest V3 CSP uyumlu kod kullan.

Inline JS kullanma.

Inline event handler kullanma:

```html
onclick=""
```

kullanma.

Bunun yerine:

```ts
element.addEventListener(...)
```

kullan.

---

# 23. SERVICE WORKER

Service worker:

- lifecycle eventlerini yönetmeli
- storage state'i yönetmeli
- whitelist işlemlerini yönetmeli
- rule enable/disable işlemlerini yönetmeli
- statistics aggregation işlemlerini yönetmeli
- message handling yapmalı

Ancak sürekli çalışan background loop oluşturma.

Şunları kullanma:

```text
setInterval sürekli polling
sonsuz loop
gereksiz websocket
persistent connection
```

Service worker event-driven olmalı.

---

# 24. MESSAGE PASSING

Popup ↔ service worker iletişimi type-safe olsun.

Örneğin:

```ts
type Message =
  | { type: "GET_STATE" }
  | { type: "TOGGLE_PROTECTION"; enabled: boolean }
  | { type: "PAUSE_SITE"; domain: string }
  | { type: "WHITELIST_SITE"; domain: string }
  | { type: "REMOVE_WHITELIST"; domain: string }
  | { type: "GET_STATISTICS"; domain?: string };
```

Unknown message type güvenli şekilde reddedilmeli.

Message payload validation yapılmalı.

---

# 25. ERROR HANDLING

Chrome API çağrılarında:

- try/catch
- runtime error handling
- invalid state handling

uygula.

Kullanıcıya teknik stack trace gösterme.

Development sırasında kontrollü error logging kullan.

Production'da console.log spam yapma.

---

# 26. TYPESCRIPT

Strict mode:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

kullan.

Avoid:

```ts
any
```

Mümkün olduğunca.

Chrome API type definitions doğru şekilde kullanılmalı.

Function'lar küçük ve single responsibility olmalı.

Magic number/string kullanma.

---

# 27. CONSTANTS

Önemli sabitleri merkezi yapıdan yönet.

Örneğin:

```ts
export const CONSTANTS = {
  STORAGE_SCHEMA_VERSION: 1,
  STATISTICS_RETENTION_DAYS: 90,
  MAX_SITE_STATISTICS: 1000,
  ...
} as const;
```

Gerçek ihtiyaçlara göre değiştir.

---

# 28. DOMAIN UTILITIES

Domain işlemlerini tek yerde topla.

Örneğin:

```text
normalizeDomain()
extractDomain()
isValidDomain()
isSameOrSubdomain()
```

Test et.

Özellikle:

```text
example.com
www.example.com
sub.example.com
example.co.uk
```

gibi durumları doğru ele al.

Public suffix problemi varsa naive string matching kullanma.

---

# 29. RULE PRIORITY

Whitelist bypass rules, blocking rules ve diğer rule'lar arasında açık priority sistemi kur.

Örneğin:

```text
highest priority
    ↓
user whitelist / bypass
    ↓
site-specific
    ↓
tracker
    ↓
ads
```

Ancak DNR'nin gerçek priority/action semantics'ine göre uygula.

Varsayımsal priority davranışı yazma.

Chrome API dokümantasyonuna göre doğru implementation yap.

---

# 30. VIDEO ADS

Video reklam engelleme konusunda gerçekçi davran.

Network-level olarak:

- known ad endpoints
- ad servers
- tracking endpoints

engellenebilir.

Ancak:

> tüm in-stream video reklamlarının kesin engellenmesi garanti edilmemelidir.

Özellikle reklam ile normal medya trafiğinin aynı endpoint üzerinden geldiği platformlarda DNR'nin doğal limitlerini kabul et.

YouTube gibi sitelerde agresif DOM manipulation yaparak kırılgan bir çözüm üretme.

---

# 31. PERFORMANCE

Öncelik:

```text
Network-level blocking
>
DOM manipulation
>
Injected JavaScript
```

Network-level blocking mümkünse JS injection yapma.

Popup:

- minimum JS
- minimum DOM
- no unnecessary fetch
- no external assets
- no runtime network request

kullansın.

Background:

- event-driven
- no polling
- no permanent state loop

olsun.

---

# 32. DEPENDENCIES

Dependency eklemeden önce gerekçesini değerlendir.

Mümkün olduğunca:

```text
0 dependency
```

veya minimum dependency hedefle.

Her dependency için README'de:

- neden kullanıldığı
- ne yaptığı
- production dependency mi development dependency mi

belirtilebilir.

Gereksiz UI framework ekleme.

---

# 33. TESTLER

Unit test ekle.

Minimum test grupları:

## Rule Tests

- valid rule
- invalid rule
- duplicate rule ID
- invalid regex
- unsupported action
- rule count validation

## Domain Tests

- apex domain
- www
- subdomain
- invalid domain
- URL normalization

## Whitelist Tests

- add
- remove
- duplicate
- subdomain
- persistence
- corrupted state

## Storage Tests

- default state
- migration
- corrupted storage
- missing fields

## Statistics Tests

- increment ads
- increment trackers
- daily aggregation
- site aggregation
- reset
- retention

## State Tests

- global enable
- global disable
- tracker toggle
- site pause
- whitelist

---

# 34. NPM SCRIPTS

Mümkünse aşağıdaki scriptleri oluştur:

```text
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
npm run validate-rules
npm run audit
```

`npm run build` production extension oluşturmalı.

Build output örneği:

```text
dist/
```

olabilir.

---

# 35. BUILD VALIDATION

Production build tamamlanmadan önce:

```text
npm install
npm run typecheck
npm run lint
npm run validate-rules
npm run test
npm run build
npm run audit
```

çalıştır.

Herhangi biri fail olursa:

1. hatayı analiz et
2. düzelt
3. ilgili command'i tekrar çalıştır
4. sonra devam et

Build fail durumunda işi tamamlanmış kabul etme.

---

# 36. MANIFEST VALIDATION

Build sonrasında production manifestini kontrol et.

Kontrol:

- Manifest V3
- valid JSON
- service worker path
- popup path
- options path
- icon paths
- permissions
- host permissions
- CSP
- rule resources
- version
- package consistency

---

# 37. SECURITY AUDIT

Final aşamada aşağıdakileri kontrol et:

### Code execution

- eval yok
- new Function yok
- remote JS yok
- dynamic code execution yok

### Data

- telemetry yok
- analytics yok
- external data transmission yok
- user tracking yok

### DOM

- unsafe innerHTML yok
- user input HTML olarak render edilmiyor

### Permissions

- gereksiz permission yok

### Network

- extension kendisi gereksiz network request yapmıyor

### Storage

- sensitive data tutulmuyor
- corrupted state handling var

---

# 38. PERFORMANCE AUDIT

Kontrol et:

- service worker sürekli çalışıyor mu?
- gereksiz event listener var mı?
- storage write spam var mı?
- popup gereksiz API çağrısı yapıyor mu?
- büyük rule listesi runtime'da parse ediliyor mu?
- DOM injection var mı?
- content script gereksiz kullanılıyor mu?
- memory leak ihtimali var mı?

Bulduğun problemleri düzelt.

---

# 39. CHROME WEB STORE UYUMLULUĞU

Extension:

- Manifest V3
- minimum permissions
- no remote code
- no telemetry
- no hidden tracking
- clear privacy behavior

prensiplerine uygun tasarlanmalı.

README'de permission'ları açıkla.

Örneğin:

```text
storage
```

→ kullanıcı ayarları ve istatistikleri saklamak için.

```text
declarativeNetRequest
```

→ network requests'i declaratively engellemek için.

Host access:

→ sitelerde reklam/tracker request'lerini filtrelemek için.

Kullanılmayan permission ekleme.

---

# 40. README

Production seviyesinde `README.md` oluştur.

İçermeli:

# Project

Amaç.

# Features

- Ad blocking
- Tracker blocking
- Site whitelist
- Site pause
- Statistics
- Filter lists
- Dark/light UI

# Architecture

Extension architecture diagram/text.

# Technologies

Kullanılan teknoloji.

# Permissions

Her permission'ın nedeni.

# Installation

```text
npm install
```

# Development

```text
npm run dev
```

# Build

```text
npm run build
```

# Testing

```text
npm run typecheck
npm run lint
npm run test
npm run validate-rules
```

# Chrome Installation

1. Chrome aç.
2. `chrome://extensions`
3. Developer Mode aç.
4. Load unpacked.
5. `dist/` klasörünü seç.

# Rule System

Static / dynamic / session rules açıklaması.

# Whitelist

Domain normalization ve subdomain davranışı.

# Statistics

Nasıl tutulduğu.

# Privacy

Kullanıcı verisinin harici sunucuya gönderilmediğini açıkla.

# Limitations

Gerçek teknik limitleri açıkla.

Özellikle:

- DNR rule limits
- video ad limitations
- browser internal pages
- platform-specific limitations

---

# 41. GELİŞTİRME SÜRECİ

Projeyi tek seferde kontrolsüz oluşturma.

Aşağıdaki sırayla ilerle:

## Phase 1

Repository analysis.

Kod yazma.

Architecture planı çıkar.

## Phase 2

Manifest V3.

Build infrastructure.

TypeScript configuration.

## Phase 3

Core blocking engine.

## Phase 4

Rule management.

## Phase 5

Storage.

## Phase 6

Background service worker.

## Phase 7

Whitelist.

## Phase 8

Pause / enable / disable.

## Phase 9

Statistics.

## Phase 10

Popup UI.

## Phase 11

Options page.

## Phase 12

Tests.

## Phase 13

README.

## Phase 14

Security audit.

## Phase 15

Performance audit.

## Phase 16

Production build.

Her phase sonrasında:

```text
typecheck
lint
test
build
```

gerekiyorsa çalıştır.

Hata varsa sonraki phase'e geçme.

---

# 42. MEVCUT KODU KORUMA

Mevcut repository'de:

```text
working feature
```

varsa sırf yeni mimariye uymuyor diye silme.

Önce:

```text
understand
→ integrate
→ refactor if necessary
```

yaklaşımını kullan.

Gereksiz rewrite yapma.

---

# 43. KOD KALİTESİ

Kod:

- readable
- modular
- testable
- maintainable
- type-safe
- production-ready

olmalı.

Fonksiyonlar küçük olsun.

Her class/module tek bir sorumluluğa sahip olsun.

Ancak gereksiz abstraction da oluşturma.

Örneğin tek satırlık fonksiyonları sırf "architecture" uğruna 10 farklı dosyaya bölme.

---

# 44. USER EXPERIENCE

Kullanıcı:

```text
Extension icon
↓
Popup
↓
ON/OFF
↓
Current site
↓
Blocked statistics
↓
Pause
↓
Whitelist
↓
Settings
```

akışını 1-2 saniye içinde anlayabilmeli.

UI gereksiz karmaşık olmamalı.

---

# 45. ACCESSIBILITY

Popup ve options page:

- keyboard accessible
- semantic HTML
- visible focus
- readable contrast
- aria labels
- button semantics

kullansın.

Toggle gerçek button/input semantics kullansın.

Sadece CSS ile fake interaction oluşturma.

---

# 46. NO DARK PATTERNS

Şunları yapma:

- kullanıcıyı whitelist'e zorlamak
- reklam göstermeye zorlamak
- tracking açtırmak
- telemetry opt-out'u gizlemek
- ayarları gizlemek
- kullanıcı verisini toplamak

Extension gerçekten privacy-first olsun.

---

# 47. FINAL OUTPUT

İş tamamlandığında aşağıdaki formatta final rapor ver:

## 1. Project Structure

Oluşturulan final klasör yapısını göster.

## 2. Architecture

Blocking engine nasıl çalışıyor?

## 3. Permissions

Kullanılan her Chrome permission'ı ve nedenini açıkla.

## 4. Rule System

Static / dynamic / session rules nasıl kullanılıyor?

## 5. Whitelist

Domain normalization ve subdomain davranışını açıkla.

## 6. Statistics

İstatistiklerin performanslı şekilde nasıl tutulduğunu açıkla.

## 7. Security Audit

Bulunan ve çözülen security problemlerini listele.

## 8. Performance Audit

Yapılan optimizasyonları listele.

## 9. Tests

Çalıştırılan testleri ve sonuçlarını göster.

Örneğin:

```text
TypeScript: PASS
Lint: PASS
Unit Tests: PASS
Rule Validation: PASS
Production Build: PASS
Manifest Validation: PASS
Security Audit: PASS
```

Gerçekte çalıştırmadığın bir şeyi `PASS` olarak yazma.

## 10. Build

Production build'in bulunduğu klasörü belirt.

## 11. Chrome Installation

Chrome'a nasıl yükleneceğini açıkla.

## 12. Production Build

Production build'in nasıl alınacağını açıkla.

## 13. Known Limitations

Gerçek teknik limitleri açıkla.

Özellikle DNR ve video advertisement limitations.

---

# 48. SON TALİMAT

Önce repository'yi analiz et.

**Kod yazmaya hemen başlama.**

İlk çıktında sadece:

1. Current repository structure
2. Existing architecture
3. Existing dependencies
4. Existing manifest
5. Problems
6. Proposed architecture
7. Migration plan
8. Riskler

raporunu ver.

Sonrasında implementasyona geç.

Ancak repository analizi tamamlandıktan sonra kod üret.

Her aşamada önce implement et, sonra:

```text
typecheck
→ lint
→ test
→ build
```

gerekiyorsa çalıştır.

Hata varsa düzelt.

Çalışan kodu gereksiz yere silme.

Varsayım yapma.

Chrome API davranışlarını tahmin etme; güncel Manifest V3/DNR API semantics'ine göre implementation yap.

Bir gereksinim Chrome'un teknik veya Web Store limitleriyle çelişiyorsa kırılgan bir workaround üretme. Bunun yerine sınırlamayı açıkça belirt ve en güvenli uygulanabilir çözümü kullan.

Hedef:

> Küçük bir demo değil; gerçek kullanıcıların günlük kullanabileceği, performansı düşük maliyetli, privacy-first, güvenli ve sürdürülebilir bir production Chrome AdBlock extension.