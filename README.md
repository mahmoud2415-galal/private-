# متابعة المشتريات للمواقع | Procurement System

نسخة Next.js جاهزة للنشر على Vercel باستخدام Supabase PostgreSQL وStorage الخاص.
العربية والإنجليزية، القائمة اليمنى، طلبات المواقع والمخزون، والفواتير والحسابات للإدارة فقط.

## حالة النسخة

هذه حزمة مصدر وليست نشرًا مكتملًا. لم يتم ربط حساب Vercel أو Supabase من داخل هذه الحزمة، ولم يتم نسخ بيانات أو صور النسخة السابقة. تبدأ قاعدة البيانات الجديدة فارغة.
نجحت اختبارات سير الطلبات والفواتير والدفع والمخزون والصلاحيات، بما فيها الاختبارات على PostgreSQL محلي عبر PGlite. يتطلب الربط الحقيقي فحصًا بعد النشر.

## رفع الملفات من الجوال

يمكن استخدام الحزمة ZIP داخل GitHub Codespaces أو ملف التثبيت المنفرد procurement-install.py:

1. من Chrome فعّل «موقع سطح المكتب» وافتح مستودعك على GitHub.
2. اختر Add file → Upload files وارفع procurement-install.py ثم Commit changes.
3. اختر Code → Codespaces → Create codespace on main وانتظر فتح المحرر.
4. افتح Terminal → New Terminal وشغّل:

```sh
python procurement-install.py
git status --short
git add app components lib public tests drizzle supabase package.json package-lock.json postcss.config.mjs tsconfig.json next.config.ts next-env.d.ts vercel.json .gitignore .env.example README.md
git commit -m "Add procurement app for Vercel and Supabase"
git push
```

ملف التثبيت يفك المصدر محليًا فقط، ولا ينشر الموقع ولا يغيّر بيانات Supabase. لا ترفع ZIP إلى Vercel مباشرة أو تتوقع أن يفكه GitHub تلقائيًا.
بديل ZIP: ارفعه إلى مستكشف الملفات في Codespaces، ثم `unzip procurement-vercel.zip -d .` داخل مجلد المستودع. الحزمة تحتوي الملفات في جذرها بدون مجلد وسيط.

## إعداد Supabase

1. نفّذ محتوى `supabase/schema.sql` في SQL Editor. إذا أنشأت الجداول بهذا المخطط مسبقًا، يمكنك تشغيله مرة أخرى. المخطط خاص بـ PostgreSQL؛ ملفات drizzle موجودة لاختبارات SQLite فقط ولا تُنفّذ في Supabase.
2. نفّذ `supabase/storage.sql`. ينشئ أو يضبط bucket باسم `invoice-files` ليكون **Private** ويسمح بصور JPG/PNG/WEBP حتى 3 ميجابايت.
3. لا تضف سياسات قراءة عامة للفواتير أو الجداول. التطبيق يستخدم الخادم للتحقق من حساب المدير قبل إرسال الصورة.
4. من Connect انسخ اتصال **Transaction pooler** بـ PostgreSQL. ضع كلمة مرور قاعدة البيانات في الرابط، مع ترميز الرموز الخاصة بصيغة URL. لا تستخدم رابط مشروع https مكان اتصال PostgreSQL.
5. من Settings → API Keys انسخ مفتاح **Secret** للخادم (`sb_secret_...`). المفتاح Publishable لا يصلح لقراءة الصور الخاصة بهذا التطبيق.

## إعداد Vercel

استورد المستودع الذي أصبح يحتوي `package.json` و`app` في الجذر.

- Framework / Application Preset: **Next.js**.
- Root Directory: **./**.
- Build command: **npm run build**.
- Output Directory: اترك الافتراضي.
- Node.js: 24.x (يمكن 22.x بإصدار 22.13 أو أحدث).

أضف متغيرات Environment Variables في Vercel قبل Deploy. لا تضعها في ملفات GitHub أو ترسلها في المحادثة:

| الاسم | القيمة |
|---|---|
| DATABASE_URL | رابط PostgreSQL من Transaction pooler في Supabase |
| SUPABASE_URL | رابط المشروع `https://PROJECT_REF.supabase.co` |
| SUPABASE_SECRET_KEY | المفتاح Secret الخاص بالخادم |
| AUTH_SECRET | قيمة عشوائية سرية بطول 32 حرفًا أو أكثر لتوقيع جلسات الدخول |
| ADMIN_INITIAL_PASSWORD | كلمة مرور أولية تختارها للمدير بطول 12 حرفًا أو أكثر، وحتى 80 حرفًا |

لإنشاء AUTH_SECRET يمكنك تشغيل `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` في Codespaces ونسخ الناتج إلى Vercel فقط.
أضف القيم إلى بيئة Production. عند تغيير المتغيرات بعد النشر أعد Deploy كي تُستخدم القيم الجديدة.
لا تفعّل حماية Vercel التي تفرض تسجيل الدخول بحساب Vercel على الموظفين إذا كان المطلوب الدخول بكلمات مرور التطبيق.

## أول دخول

- اسم المستخدم: **admin**.
- كلمة المرور: القيمة التي أدخلتها بنفسك في `ADMIN_INITIAL_PASSWORD`.
- تُنشأ تلقائيًا أربعة حسابات مواقع **S01، S02، S03، S04** بحالة موقوفة، ولا توجد كلمات مرور افتراضية لها.
- من «المستخدمون والصلاحيات» عيّن اسم كل موقع وكلمة مروره ثم فعّل الحساب.
- غيّر كلمة مرور المدير بعد أول دخول. بعد التأكد من وجود حساب المدير احذف ADMIN_INITIAL_PASSWORD من إعدادات Vercel وأعد النشر؛ يبقى الحساب وكلمة مروره الجديدة محفوظين في قاعدة البيانات.
- تغيير AUTH_SECRET يسجّل خروج جميع المستخدمين. حافظ على القيمة ثابتة ما لم تتعمد إنهاء الجلسات.

## فحص بعد النشر

1. سجّل الدخول كمدير وأضف موردًا وفعّل حساب موقع.
2. من حساب الموقع أرسل طلبًا من عدة أصناف. يجب أن يرى الموقع طلباته ومخزونه فقط، ولا يرى صفحات الفواتير أو الحسابات ولا يمكنه رفع صور فواتير.
3. من المدير اعتمد الطلب وأصدر أمر الشراء وسجّل الاستلام، ثم سجّل فاتورة وأرفق صورة صغيرة.
4. أضف دفعة جزئية وتحقق من المتبقي، ثم راجع تقرير الموقع والمخزون.
5. بدّل العربية والإنجليزية وتأكد من حفظ بيانات الطلب.
6. حدّث الصفحة وسجّل خروجًا ودخولًا للتأكد من الاستمرار.

إذا ظهر «إعدادات قاعدة البيانات غير مكتملة» راجع DATABASE_URL وأعد النشر. إذا ظهرت مشكلة في صورة الفاتورة راجع SUPABASE_URL وSUPABASE_SECRET_KEY وbucket الخاص. عند فشل Deploy اقرأ أول خطأ في Build Logs؛ لا تنشر كلمات المرور أو المفاتيح مع صورة الخطأ.

مزامنة Google Sheets السابقة لا تنتقل تلقائيًا؛ نقطة التصدير اختيارية ومقفلة بدون SYNC_READ_TOKEN_HASH، ولا يوجد مجدول مزامنة في هذه الحزمة.

## Development

```sh
npm ci
cp .env.example .env.local
# Fill .env.local with your own server credentials.
npm run dev
npm test
npm run build
```

All database writes use a transaction-scoped PostgreSQL advisory lock to preserve atomic balance checks for payments and inventory. This favors correctness for a small procurement system over high write throughput. PGlite tests validate SQL and business rules; they do not validate hosted pooler networking or multi-instance concurrency.
