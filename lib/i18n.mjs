let language='ar';const listeners=new Set();
export const getLanguage=()=>language;
export function subscribeLanguage(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function setLanguage(value){if(!['ar','en'].includes(value))return;language=value;try{localStorage.setItem('procurement-language',value);}catch{}for(const fn of listeners)fn();}
export function loadLanguage(){try{const value=localStorage.getItem('procurement-language');if(value)setLanguage(value);}catch{}}
export const dictionary=Object.fromEntries(`
بانتظار المراجعة	Pending review
مطلوب تعديل	Revision required
معتمد	Approved
مرفوض	Rejected
قيد التوريد	Being supplied
استلام جزئي	Partially received
تم الاستلام	Received
ملغي	Cancelled
قطعة	Piece
إغلاق	Close
تجديد الدخول إلى الموقع	Renew site sign-in
فتح بيانات النظام في Google Sheets	Open system data in Google Sheets
نسخ الرابط	Copy link
إذا لم يفتح الشيت من داخل التطبيق، انسخ الرابط وافتحه في Chrome أو Safari بحساب Google الذي يملك الملف.	If the sheet does not open in the app, copy the link and open it in Chrome or Safari with the Google account that owns the file.
تم نسخ رابط بيانات النظام.	System data link copied.
رابط بيانات النظام	System data link
اضغط مطولًا على الرابط لنسخه، ثم الصقه في متصفح هاتفك.	Press and hold the link to copy it, then paste it into your phone browser.
تم الحفظ	Saved
رقم الطلب	Request number
التاريخ	Date
الموقع	Site
مقدم الطلب	Requested by
الصنف	Item
المواصفات	Specifications
الكمية المطلوبة	Requested quantity
الوحدة	Unit
الأولوية	Priority
السبب	Reason
الحالة	Status
الكمية المعتمدة	Approved quantity
المورد	Supplier
سعر الوحدة المعتمد	Approved unit price
الكمية المستلمة	Received quantity
قيمة المستلم	Received value
ملاحظات المراجعة	Review notes
أمر الشراء	Purchase order
التوريد المتوقع	Expected delivery
سجل_المشتريات.csv	Purchase_register.csv
تم تنزيل سجل المشتريات	Purchase register downloaded
جارٍ فتح مساحة المشتريات…	Opening the procurement workspace…
الصفحة الرئيسية	Home
طلبات الشراء	Purchase requests
أوامر الشراء	Purchase orders
فواتير الموردين	Supplier invoices
المخزون	Inventory
الحسابات	Accounts
التقارير	Reports
طلب مشتريات	New purchase request
إدارة الموردين	Supplier management
إعدادات النظام	System settings
إدارة المشتريات	Procurement management
مساحة الموقع	Site workspace
التنقل الرئيسي	Main navigation
مخزون الموقع	Site inventory
صلاحيات المدير	Administrator access
مسؤول الموقع	Site representative
تسجيل الخروج	Sign out
إظهار القائمة الجانبية	Show sidebar
توسيع مساحة العمل	Expand workspace
إظهار القائمة	Show menu
توسيع المساحة	Expand workspace
تحديث البيانات	Refresh data
تحديث	Refresh
طلب جديد	New request
إضافة مورد	Add supplier
لوحة تحكم الموقع	Site dashboard
سجّل احتياجات الموقع وتابع الاعتماد والتوريد والاستلام.	Record site needs and track approval, supply and receipt.
معتمد ولم يكتمل	Approved, not completed
إجمالي الطلبات	Total requests
طلب مشتريات جديد	New purchase request
متابعة طلبات الموقع	Track site requests
احتياجات الموقع	Site requirements
سجّل جميع المشتريات التي تحتاجها في طلب واحد، ثم أرسلها للمدير.	Add all required items to one request, then submit it to the administrator.
يُربط الطلب بهذا الموقع تلقائيًا	The request is automatically linked to this site
تم إرسال طلب المشتريات للمدير للمراجعة	Purchase request submitted for administrator review
راجع احتياجات المواقع، وحدد المورد، وتابع التوريد حتى الاستلام.	Review site needs, select suppliers and track supply through receipt.
أرسل احتياجات موقعك، وتابع قرار المدير، وسجّل الكميات عند وصولها.	Submit site requirements, track approval and record quantities when delivered.
آخر تحديث	Last updated
قيمة المشتريات المعتمدة	Approved purchase value
بالعملة المتفق عليها	In the agreed currency
· بدون ضرائب إضافية	· Excluding additional taxes
سجل الطلبات	Request register
متابعة الطلبات	Track requests
اضغط على الطلب لعرض التفاصيل والإجراءات.	Select a request to view its details and available actions.
تصدير الكل	Export all
البحث في الطلبات المحملة	Search loaded requests
رقم الطلب، الصنف، مقدم الطلب…	Request number, item, requester…
تصفية حسب الحالة	Filter by status
كل الحالات	All statuses
تصفية حسب الموقع	Filter by site
كل المواقع	All sites
تاريخ إنشاء الطلب	Request creation date
من	From
تاريخ الطلب من	Request date from
إلى	To
تاريخ الطلب إلى	Request date to
كل الفترة	All dates
البحث يشمل الطلبات المحمّلة. حمّل المزيد للبحث في الطلبات الأقدم.	Search covers loaded requests. Load more to search older requests.
سجل طلبات المشتريات	Purchase request register
الموقع / مقدم الطلب	Site / requester
الأصناف المطلوبة	Requested items
تاريخ الطلب	Request date
حالة الطلب	Request status
الإجراء	Action
،	,
صنف	Item
عادية	Normal
عرض تفاصيل	View details
التفاصيل	Details
لا توجد طلبات تطابق البحث	No matching requests
ابدأ بأول طلب	Create your first request
جرّب تغيير البحث أو التصفية.	Try changing the search or filters.
عندما يرسل مسؤول الموقع طلبًا سيظهر هنا للمراجعة.	Requests submitted by site representatives appear here for review.
أضف الأصناف والكميات المطلوبة، وسيراجعها المدير.	Add the required items and quantities for administrator review.
إنشاء طلب	Create request
تحميل طلبات أقدم	Load older requests
طلب محمّل · الملخص يشمل طلبات	loaded request(s) · Summary covers requests for
المواقع	Sites
موقعك	your site
التي أنشئت خلال الفترة المحددة	created during the selected period
خلال كل الفترة	across all dates
احتفظ ببيانات التواصل، واختر المورد أثناء اعتماد الطلب.	Maintain contact details and select a supplier when approving a request.
نشط	Active
موقوف	Inactive
لم يسجل هاتف	No phone recorded
لم يسجل بريد	No email recorded
تعديل المورد	Edit supplier
أضف المورد الأول	Add your first supplier
تحتاج موردًا نشطًا لاعتماد الطلبات وتجهيز أوامر الشراء.	An active supplier is required to approve requests and prepare purchase orders.
عدّل المستخدمين وكلمات المرور، وحدد صلاحية كل حساب.	Manage users, passwords and permissions for each account.
تطبّق الصلاحيات على الحساب بعد الحفظ. تغيير كلمة المرور يبطل الكود أو كلمة المرور السابقة وينهي جلساته الأخرى.	Permissions take effect after saving. Changing a password invalidates the previous password or code and signs out other sessions.
الدخول مفعّل	Sign-in enabled
الدخول موقوف	Sign-in disabled
الحساب الرئيسي — جميع صلاحيات الإدارة	Main account — full administrator access
مشاهدة طلبات الموقع فقط	View own site requests only
إدارة المستخدم	Manage user
النسخ التلقائي إلى الشيت	Automatic spreadsheet copy
نسخة من بيانات النظام تُحدّث كل ساعة.	A copy of system data is updated every hour.
اعمل داخل النظام لتسجيل الطلبات والاعتماد والاستلام. ستظهر التحديثات في صفحة «بيانات النظام» في الشيت. التعديل داخل الشيت لا يعود إلى النظام.	Use this system to record requests, approvals and receipts. Updates appear in the spreadsheet's System Data tab. Spreadsheet edits do not update the system.
آخر مزامنة ناجحة	Last successful sync
بانتظار أول مزامنة	Waiting for first sync
بنود نُقلت	Lines transferred
التحديث	Update frequency
تلقائي كل ساعة	Automatically every hour
تعذر آخر تحديث:	Last update failed:
قد يتأخر التشغيل قليلًا أو يتوقف إذا انقطع اتصال Google. يظهر وقت آخر نجاح أعلاه.	Updates may be delayed or stop if the Google connection is interrupted. The last successful update is shown above.
تم حفظ اسم النظام ومسميات الصفحات	System name and page labels saved
تُحفظ البيانات تلقائيًا بعد تأكيد كل عملية	Data is saved after each confirmed action
تم إرسال الطلب للمراجعة	Request submitted for review
تم تحديث بيانات المستخدم	User details updated
اسم النظام	System name
الوصف المختصر تحت اسم النظام	Short subtitle below the system name
اسم صفحة الطلبات	Requests page label
اسم صفحة الموردين	Suppliers page label
اسم صفحة المستخدمين والصلاحيات	Users and permissions page label
اسم صفحة مزامنة Google Sheets	Google Sheets sync page label
اسم النظام ومسميات الصفحات	System name and page labels
اكتب المسميات التي تريد أن تظهر لك ولمسؤولي المواقع.	Enter the labels to display for you and site representatives.
تم حفظ المسميات، وتظهر عند فتح النظام أو تحديثه.	Labels saved. They appear when the system is opened or refreshed.
معاينة اسم النظام	System name preview
جارٍ الحفظ…	Saving…
حفظ المسميات	Save labels
من الاحتياج إلى الاستلام	From requirement to receipt
كل طلب.	Every request.
في مساره الصحيح.	On the right track.
مساحة واحدة تجمع مسؤولي المواقع والإدارة لمتابعة المشتريات خطوة بخطوة.	One workspace for site representatives and management to track procurement step by step.
طلب من الموقع	Site request
الأصناف والمواصفات والكميات	Items, specifications and quantities
مراجعة واعتماد	Review and approval
الكمية والسعر والمورد المختار	Quantity, price and selected supplier
توريد واستلام	Supply and receipt
متابعة حتى وصول آخر صنف	Track delivery through the final item
وضوح في الطلب · مسؤولية في القرار	Clear requests · Accountable decisions
أهلًا بك في	Welcome to
الدخول إلى مساحة العمل	Sign in to the workspace
أدخل اسم المستخدم وكلمة المرور، أو استخدم كودك الحالي.	Enter your username and password, or use your existing code.
اسم المستخدم	Username
مثل admin أو S01. يمكن تركه فارغًا عند استخدام الكود القديم.	For example admin or S01. Leave blank when using a legacy code.
كلمة المرور أو كود الدخول	Password or access code
أدخل كلمة المرور أو الكود	Enter your password or code
إخفاء الكود	Hide code
إظهار الكود	Show code
جارٍ التحقق…	Verifying…
تسجل الدخول	Sign in
كودك يحدد صلاحياتك. إذا لم يكن لديك كود، تواصل مع المدير.	Your code determines your access. Contact the administrator if you do not have one.
مصمم للعمل من الجوال والكمبيوتر	Designed for mobile and desktop
تجديد جلسة حساب الموقع	Renew site account session
أدخل كلمة المرور أو الكود للحساب نفسه. ستبقى الأصناف المكتوبة كما هي.	Enter the password or code for the same account. Your entered items will be preserved.
يجب الدخول بحساب الموقع نفسه	Sign in with the same site account
جارٍ تجديد الدخول…	Renewing sign-in…
تجديد جلسة الحساب	Renew account session
عاجلة	Urgent
طارئة	Emergency
تم استعادة مسودة الطلب على هذا الجهاز. راجعها قبل الإرسال.	Request draft restored on this device. Review it before submitting.
تعذر حفظ المسودة على هذا الجهاز. أبقِ الصفحة مفتوحة حتى تأكيد الإرسال.	The draft could not be saved on this device. Keep the page open until submission is confirmed.
حدد احتياجات الموقع بوضوح، ثم أرسلها للمدير للمراجعة.	Specify site needs clearly, then submit them for administrator review.
اسم مقدم الطلب	Requester name
سبب الطلب	Reason for request
لماذا يحتاج الموقع هذه الأصناف؟	Why does the site need these items?
حذف الصنف	Remove item
اسم الصنف	Item name
الكمية	Quantity
المواصفات / ملاحظات الصنف	Specifications / item notes
المقاس، النوع، الماركة أو أي تفاصيل…	Size, type, brand or other details…
إضافة صنف آخر	Add another item
يمكن إضافة حتى 50 صنفًا في الطلب الواحد. راجع الكميات قبل الإرسال.	You can add up to 50 items per request. Review quantities before submitting.
تم تجديد الدخول. اضغط إرسال طلب المشتريات لإكمال الإرسال.	Sign-in renewed. Select Submit purchase request to complete submission.
جارٍ الإرسال…	Submitting…
إرسال طلب المشتريات	Submit purchase request
العودة لسجل الطلبات	Back to request register
تعديل الطلب	Edit request
تعذر تحميل الفواتير	Could not load invoices
اختر صورة بحجم لا يتجاوز 3 ميجابايت	Choose an image no larger than 3 MB
اختر صورة JPG أو PNG أو WEBP	Choose a JPG, PNG or WEBP image
تعذر رفع الفاتورة	Could not upload invoice
تم حفظ الصورة على هذه الفاتورة.	Image saved to this invoice.
تم حفظ صورة الفاتورة على الطلب.	Invoice image saved to the request.
صور الفواتير	Invoice images
ارفع صورة هذه الفاتورة لعرضها في الحسابات والتقارير.	Upload this invoice image to view it in Accounts and Reports.
اربط صورة الفاتورة بهذا الطلب لعرضها والرجوع إليها لاحقًا.	Attach an invoice image to this request for later reference.
اختيار صورة الفاتورة	Choose invoice image
جارٍ الرفع…	Uploading…
رفع وحفظ الصورة	Upload and save image
JPG · PNG · WEBP — حتى 3 ميجابايت للصورة	JPG · PNG · WEBP — up to 3 MB per image
جارٍ تحميل صور الفواتير…	Loading invoice images…
لم تُرفق صورة فاتورة بهذا الطلب بعد.	No invoice image has been attached to this request yet.
عرض	View
صورة الفاتورة	Invoice image
تنزيل	Download
إغلاق الصورة	Close image
تفاصيل	Details
اعتماد جزئي للكمية	Partially approved quantity
لم يحدد بعد	Not selected yet
ملاحظات المدير	Administrator notes
الأصناف والكميات	Items and quantities
بدون مواصفات إضافية	No additional specifications
مطلوب	Requested
مستلم	Received
سعر الوحدة:	Unit price:
· إجمالي المعتمد:	· Approved total:
إجمالي القيمة المعتمدة	Total approved value
يمكن اعتماد جزء من الكمية. أدخل صفرًا للصنف غير المعتمد.	You may approve a partial quantity. Enter zero for an item that is not approved.
المطلوب	Requested
سعر الوحدة	Unit price
المورد المختار	Selected supplier
اختر موردًا نشطًا	Choose an active supplier
أضف موردًا من صفحة الموردين قبل الاعتماد.	Add a supplier on the Suppliers page before approving.
ملاحظات القرار	Decision notes
مطلوبة عند الرفض أو طلب التعديل	Required when rejecting or requesting a revision
اعتماد الكميات	Approve quantities
طلب تعديل	Request revision
رفض الطلب	Reject request
تجهيز أمر الشراء	Prepare purchase order
ابدأ التوريد ثم اطبع أمر الشراء وأرسله بنفسك للمورد.	Start supply, then print the purchase order and send it to the supplier.
رقم أمر الشراء	Purchase order number
تاريخ التوريد المتوقع	Expected delivery date
بدء التوريد وتجهيز الأمر	Start supply and prepare order
التوريد المتوقع:	Expected delivery:
غير محدد	Not specified
عرض أمر الشراء	View purchase order
تسجيل استلام جديد	Record a new receipt
أدخل الكميات التي وصلت الآن فقط. يُغلق الطلب تلقائيًا عند استلام كل الكميات المعتمدة.	Enter only quantities delivered now. The request closes automatically when all approved quantities are received.
المتبقي	Remaining
المستلم الآن	Received now
ملاحظات الاستلام	Receipt notes
النواقص أو الملاحظات على الأصناف	Shortages or item notes
تأكيد الكميات المستلمة	Confirm received quantities
تعديل الطلب وإعادة الإرسال	Edit and resubmit request
سجل الاستلام	Receipt history
مسار الطلب	Request timeline
سبب إلغاء الطلب	Cancellation reason
تأكيد الإلغاء	Confirm cancellation
إلغاء الطلب	Cancel request
جارٍ حفظ العملية…	Saving action…
إغلاق التفاصيل	Close details
اسم المورد	Supplier name
رقم التواصل	Contact number
البريد الإلكتروني	Email
الأصناف المتوفرة وملاحظات المورد	Available items and supplier notes
مورد نشط متاح للاعتماد	Active supplier available for approval
حفظ المورد	Save supplier
إنشاء الطلبات وتعديلها	Create and edit requests
تسجيل الاستلام	Record receipts
مراجعة واعتماد الطلبات	Review and approve requests
تجهيز أوامر الشراء	Prepare purchase orders
إدارة مستخدمي المواقع	Manage site users
مشاهدة جميع المواقع	View all sites
مشاهدة الأسعار	View prices
إدارة	Manage
تأكيد كلمة المرور غير مطابق	Password confirmation does not match
تم تغيير كلمة المرور. استخدم اسم المستخدم مع كلمة المرور الجديدة.	Password changed. Use your username with the new password.
تم حفظ الصلاحيات	Permissions saved
اسم المستخدم للدخول	Sign-in username
اسم المدير	Administrator name
اسم الموقع / المستخدم	Site / user name
السماح بتسجيل الدخول	Allow sign-in
كلمة المرور	Password
اتركها فارغة للاحتفاظ بالحالية. يمكنك كتابة كلمة مرور جديدة أو توليد واحدة.	Leave blank to keep the current password. Enter or generate a new one.
كلمة المرور أو الكود الحالي	Current password or code
مطلوب عند تغيير كلمة مرور حسابك	Required when changing your account password
توليد كلمة مرور	Generate password
كلمة المرور الجديدة	New password
10 أحرف أو أرقام على الأقل؛ احفظها قبل تأكيد التغيير.	At least 10 letters or digits; keep a copy before confirming the change.
تأكيد كلمة المرور	Confirm password
الصلاحيات	Permissions
الحساب الرئيسي يحتفظ بجميع صلاحيات الإدارة.	The main account retains full administrator access.
كلمة المرور المحفوظة لهذا الحساب	Saved password for this account
دخول_	Login_
تنزيل بيانات الدخول	Download sign-in details
حفظ المستخدم والصلاحيات	Save user and permissions
أمر شراء	Purchase order
تاريخ الأمر	Order date
مرجع الطلب	Request reference
تواصل المورد	Supplier contact
الصنف والمواصفات	Item and specifications
الإجمالي	Total
إجمالي أمر الشراء	Purchase order total
ملاحظات:	Notes:
القيم بالعملة المتفق عليها، دون حساب ضرائب أو رسوم إضافية.	Values are in the agreed currency and exclude additional taxes or fees.
طباعة / حفظ PDF	Print / save PDF
أرسل النسخة للمورد من هاتفك بعد الحفظ.	Send the saved copy to the supplier from your phone.
مدفوعة	Paid
مدفوعة جزئيًا	Partially paid
غير مدفوعة	Unpaid
إجمالي الفواتير	Total invoices
ر.س	SAR
فاتورة	Invoice
المبلغ المدفوع	Paid amount
الدفعات المسجلة على الفواتير	Recorded invoice payments
المتبقي للدفع	Outstanding amount
فاتورة بها رصيد	invoice(s) with an outstanding balance
الفاتورة / التاريخ	Invoice / date
الموقع / المورد	Site / supplier
الطلب	Request
المدفوع	Paid
الاستحقاق	Due date
الفاتورة والصورة	Invoice and image
تسجيل دفعة	Record payment
لا توجد فواتير تطابق الاختيار. سجّل أول فاتورة من صفحة فواتير الموردين.	No invoices match the selection. Record your first invoice on the Supplier Invoices page.
رقم الفاتورة	Invoice number
الإجمالي ر.س	Total SAR
المدفوع ر.س	Paid SAR
المتبقي ر.س	Outstanding SAR
حالة الدفع	Payment status
فواتير_	Invoices_
جميع_المواقع	All_sites
بحث	Search
الصنف أو المواصفات	Item or specifications
الرقم أو المورد أو الصنف	Number, supplier or item
كل الموردين	All suppliers
من تاريخ الفاتورة	Invoice date from
إلى تاريخ الفاتورة	Invoice date to
إغلاق التنبيه	Dismiss notification
جارٍ تحميل بيانات الإدارة…	Loading management data…
نظرة عامة على المواقع	Sites overview
لوحة تحكم المشتريات	Procurement dashboard
طلبات المواقع، التوريد، الفواتير والمخزون في مكان واحد.	Site requests, supply, invoices and inventory in one place.
طلبات بانتظار المراجعة	Requests pending review
أوامر معتمدة قيد التنفيذ	Approved orders in progress
طلبات مكتملة الاستلام	Fully received requests
فواتير غير مسددة بالكامل	Invoices with outstanding balances
عرض التفاصيل ←	View details →
الفواتير حسب الموقع	Invoices by site
القيمة المسجلة والمتبقي لكل موقع.	Recorded and outstanding amounts for each site.
الوصول السريع	Quick access
ابدأ الإجراء من الصفحة المناسبة.	Start each action on its relevant page.
مراجعة طلبات المواقع	Review site requests
تسجيل فاتورة ورفع صورتها	Record an invoice and upload its image
عرض أرصدة المخزون	View inventory balances
تقرير فواتير موقع	Site invoice report
أوامر الشراء المعتمدة	Approved purchase orders
كل الطلبات المعتمدة من الإدارة، مع متابعة التوريد والاستلام.	All administrator-approved requests, with supply and receipt tracking.
الطلب / أمر الشراء	Request / purchase order
الأصناف	Items
القيمة المعتمدة ر.س	Approved value SAR
حالة التوريد	Supply status
لم يصدر أمر التوريد بعد	Supply order not issued yet
التفاصيل / أمر الشراء	Details / purchase order
لا توجد أوامر شراء معتمدة حتى الآن.	There are no approved purchase orders yet.
الحسابات والمدفوعات	Accounts and payments
تقارير فواتير المواقع	Site invoice reports
سجّل دفعة كاملة أو جزئية وتابع المتبقي على كل فاتورة.	Record full or partial payments and track each invoice's outstanding balance.
اختر موقعًا والفترة لعرض فواتيره وصورها، ثم صدّر التقرير أو اطبعه.	Select a site and date range to view its invoices and images, then export or print the report.
سجّل فاتورة المورد على طلب بدأ توريده، ثم ارفع صورة الفاتورة.	Record a supplier invoice against a request being supplied, then upload its image.
تسجيل فاتورة	Record invoice
تصدير Excel CSV	Export Excel CSV
طباعة / PDF	Print / PDF
سجل الدفعات	Payment history
الدفعات الخاصة بالفواتير الظاهرة حسب التصفية الحالية.	Payments for invoices matching the current filters.
صور فواتير سابقة على الطلبات	Earlier invoice images on requests
صور محفوظة قبل إضافة الحسابات، لم تُربط بسجل فاتورة مالي بعد. افتح الطلب للاطلاع عليها.	Images saved before the Accounts feature that are not linked to a financial invoice record. Open the request to view them.
المخزون حسب الموقع	Inventory by site
الرصيد = الكميات المستلمة من الطلبات + الإضافات − الصرف. الأصناف المتطابقة بالاسم والمواصفات والوحدة تُجمع معًا.	Balance = received request quantities + additions − issues. Items with matching names, specifications and units are grouped together.
إضافة رصيد	Add stock
الصنف / المواصفات	Item / specifications
استلام الطلبات	Request receipts
إضافات	Additions
مصروف	Issued
الرصيد	Balance
إضافة / صرف	Add / issue stock
لا توجد أرصدة بعد. تظهر الكميات عند تسجيل استلام الطلبات، أو يمكنك إضافة رصيد افتتاحي.	No balances yet. Quantities appear when request receipts are recorded, or you can add opening stock.
حركات المخزون المسجلة	Recorded inventory movements
الإضافات	Additions
المصروف	Issued
تصدير المخزون	Export inventory
الحركة	Movement
سجّلها	Recorded by
إضافة	Addition
صرف	Issue
تم تسجيل الفاتورة. ارفع صورتها من نافذة الفاتورة.	Invoice recorded. Upload its image in the invoice window.
تاريخ الفاتورة	Invoice date
دفعات الفاتورة	Invoice payments
تم تسجيل الدفعة وتحديث المبلغ المتبقي.	Payment recorded and outstanding balance updated.
تم تسجيل حركة المخزون.	Inventory movement recorded.
تقرير فواتير المواقع	Site invoice report
تقرير فواتير	Invoice report
جميع المواقع	All sites
تاريخ التقرير	Report date
· الفترة	· Period
البداية	Beginning
حتى اليوم	Through today
· المورد	· Supplier
· حالة الدفع	· Payment status
· البحث	· Search
الفاتورة	Invoice
عدد الفواتير:	Invoice count:
. صور الفواتير متاحة عبر فتح الفاتورة في صفحة التقارير.	. Open an invoice on the Reports page to view its images.
المبلغ ر.س	Amount SAR
الطريقة	Method
المرجع	Reference
سجلها	Recorded by
لا توجد دفعات مسجلة.	No payments recorded.
تسجيل فاتورة مورد	Record supplier invoice
طلب التوريد	Supply request
اختر الطلب والمورد والموقع	Select a request, supplier and site
لا توجد طلبات بدأ توريدها. اعتمد طلبًا ثم ابدأ التوريد من صفحة أوامر الشراء.	No requests are being supplied. Approve a request and start supply on the Purchase Orders page.
رقم فاتورة المورد	Supplier invoice number
إجمالي الفاتورة بالريال (شامل الضريبة إن وجدت)	Invoice total in SAR (including applicable tax)
تاريخ الاستحقاق (اختياري)	Due date (optional)
ملاحظات	Notes
يمكن تسجيل أكثر من فاتورة للتوريد الجزئي على الطلب. أدخل بيانات الفاتورة كما هي؛ يمكن رفع صورتها بعد الحفظ.	Multiple invoices can be recorded for partial deliveries on one request. Enter invoice details as issued; upload its image after saving.
حفظ الفاتورة ورفع الصورة	Save invoice and upload image
إلغاء	Cancel
تحويل بنكي	Bank transfer
تسجيل دفعة —	Record payment —
المبلغ المتبقي:	Outstanding amount:
المبلغ المدفوع ر.س	Paid amount SAR
تاريخ الدفع	Payment date
طريقة الدفع	Payment method
نقدي	Cash
بطاقة	Card
أخرى	Other
رقم التحويل أو المرجع	Transfer number or reference
حفظ الدفعة	Save payment
تسجيل حركة مخزون	Record inventory movement
الرصيد الحالي:	Current balance:
اختر الموقع	Select site
نوع الحركة	Movement type
إضافة / رصيد افتتاحي	Addition / opening stock
صرف / استهلاك	Issue / consumption
سبب الحركة	Movement reason
رصيد افتتاحي، استهلاك بالموقع، أو تفاصيل الإضافة	Opening stock, site consumption or addition details
حفظ الحركة	Save movement
قيمة نصية غير صحيحة	Invalid text value
النص أطول من المسموح	Text exceeds the allowed length
أكمل الحقول المطلوبة	Complete all required fields
الكمية أو السعر غير صحيح	Invalid quantity or price
أضف من صنف واحد إلى 50 صنفًا	Add between 1 and 50 items
الكمية المطلوبة يجب أن تكون أكبر من صفر	Requested quantity must be greater than zero
لا تملك صلاحية إنشاء الطلبات	You do not have permission to create requests
الأولوية غير صحيحة	Invalid priority
إرسال طلب	Request submitted
لا تملك صلاحية هذا الطلب	You do not have access to this request
لا تملك صلاحية المراجعة	You do not have review permission
لا يمكن تعديل المراجعة بعد التوريد أو إغلاق الطلب	Review cannot be changed after supply starts or the request is closed
قرار غير صحيح	Invalid decision
راجع جميع الأصناف	Review all items
الكمية المعتمدة تتجاوز المطلوبة	Approved quantity exceeds the requested quantity
اعتمد كمية واحدة على الأقل أو اختر رفض	Approve at least one quantity or reject the request
اكتب سبب الرفض أو التعديل	Enter a rejection or revision reason
اعتماد جزئي	Partial approval
التعديل متاح للموقع عندما يطلبه المدير	The site may edit a request when the administrator requests a revision
إعادة إرسال بعد التعديل	Resubmitted after revision
لا تملك صلاحية التوريد	You do not have supply permission
اعتمد الطلب قبل التوريد	Approve the request before starting supply
تاريخ التوريد غير صحيح	Invalid delivery date
تجهيز أمر الشراء وبدء التوريد	Purchase order prepared and supply started
الاستلام متاح لمسؤول موقع الطلب المصرح له	Only the authorized representative of the request's site may record receipts
الطلب ليس قيد التوريد	The request is not being supplied
راجع جميع كميات الاستلام	Review all received quantities
الكمية المستلمة تتجاوز الكمية المعتمدة	Received quantity exceeds the approved quantity
أدخل كمية مستلمة أكبر من صفر	Enter a received quantity greater than zero
لا تملك صلاحية إلغاء الطلب	You do not have permission to cancel this request
لا يمكن إلغاء طلب بدأ توريده	A request cannot be cancelled after supply starts
إجراء غير معروف	Unknown action
تعذر حفظ أو تحميل صورة الفاتورة	Could not save or load the invoice image
معرف الطلب غير صحيح	Invalid request ID
الطلب غير موجود	Request not found
لا تملك صلاحية صور فاتورة هذا الطلب	You do not have access to this request's invoice images
معرف الصورة غير صحيح	Invalid image ID
الصورة غير موجودة	Image not found
حفظ الصور غير متاح حاليًا	Image storage is currently unavailable
تعذر العثور على الصورة المحفوظة	Saved image not found
الفاتورة غير موجودة	Invoice not found
مصدر الطلب غير صحيح	Invalid request origin
رفع صور الفواتير متاح للمدير فقط	Only the administrator may upload invoice images
ارفع الصورة من نموذج الفاتورة	Upload the image using the invoice form
حجم الصورة يجب ألا يتجاوز 3 ميجابايت	Image size must not exceed 3 MB
اختر صورة الفاتورة	Select an invoice image
معرف الرفع غير صحيح	Invalid upload ID
معرف الفاتورة غير صحيح	Invalid invoice ID
الفاتورة لا تخص هذا الطلب	The invoice does not belong to this request
معرف الرفع مستخدم	Upload ID already used
الصيغ المسموحة JPG وPNG وWEBP	Allowed formats: JPG, PNG and WEBP
يمكن حفظ 20 صورة لكل طلب	Up to 20 images can be stored per request
لم تُحفظ الصورة؛ حدّث قائمة الفواتير وحاول مجددًا	Image not saved. Refresh the invoice list and try again
أدخل مبلغًا موجبًا بمنزلتين عشريتين كحد أقصى	Enter a positive amount with at most two decimal places
المبلغ غير صحيح	Invalid amount
معرف العملية غير صحيح	Invalid operation ID
التاريخ غير صحيح	Invalid date
تعذر حفظ أو تحميل البيانات	Could not save or load data
هذه الصفحة متاحة للإدارة المصرح لها فقط	This page is available only to authorized administrators
غير مسموح	Access denied
الحفظ المالي والمخزون متاح لحساب المدير فقط	Only the administrator may save financial and inventory records
الطلب كبير جدًا	Request is too large
بيانات غير صحيحة	Invalid data
معرف العملية مستخدم لفاتورة أخرى	Operation ID already used for another invoice
اختر طلبًا بدأ توريده من المورد	Select a request whose supply has started
المورد غير محدد	Supplier not selected
الاستحقاق لا يسبق تاريخ الفاتورة	Due date cannot precede the invoice date
رقم الفاتورة مسجل لهذا المورد بالفعل	This invoice number is already recorded for the supplier
طريقة الدفع غير صحيحة	Invalid payment method
معرف العملية مستخدم لدفعة أخرى	Operation ID already used for another payment
الدفعة تتجاوز المبلغ المتبقي أو تم تحديث الفاتورة. حدّث البيانات	Payment exceeds the outstanding amount or the invoice changed. Refresh the data
أدخل كمية أكبر من صفر	Enter a quantity greater than zero
نوع الحركة غير صحيح	Invalid movement type
معرف العملية مستخدم لحركة أخرى	Operation ID already used for another movement
الموقع غير موجود	Site not found
الكمية المطلوبة للصرف أكبر من الرصيد المتاح. حدّث المخزون	Issue quantity exceeds available stock. Refresh inventory
إجراء غير صحيح	Invalid action
انتهت جلسة الدخول إلى الموقع. جدّد الدخول ثم أعد إرسال الطلب؛ لا تغيّر الأصناف.	Site sign-in expired. Renew sign-in, then resubmit the same request without changing its items.
تعذر الوصول إلى خدمة النظام مؤقتًا. احتفظ بالطلب وحاول إرساله مرة أخرى.	The system is temporarily unavailable. Keep your request and try submitting it again.
وصل رد غير مكتمل من النظام. أعد المحاولة بنفس الطلب.	The system returned an incomplete response. Retry the same request.
انتهت جلسة الحساب. سجّل الدخول مجددًا.	Your account session expired. Sign in again.
تعذر الاتصال بالنظام	Could not connect to the system
محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة	Too many attempts. Wait 15 minutes and try again
كود الدخول غير صحيح أو تم إيقافه	Incorrect access code or account disabled
الفترة غير صحيحة	Invalid date range
بداية الفترة بعد نهايتها	Start date is after the end date
تعذر تحميل البيانات	Could not load data
يعدّل المدير الرئيسي مسميات النظام فقط	Only the main administrator may change system labels
نسخة الإعدادات غير صحيحة	Invalid settings version
تغيرت المسميات من جهاز آخر. حدّث الصفحة قبل إعادة الحفظ	Labels changed on another device. Refresh before saving again
لا تملك صلاحية إدارة الموردين	You do not have permission to manage suppliers
لا تملك صلاحية إدارة المستخدمين	You do not have permission to manage users
المستخدم غير موجود	User not found
الحساب الرئيسي يعدّل بياناته بنفسه	The main account must edit its own details
لا يمكن تعطيل الحساب الرئيسي	The main account cannot be disabled
الكود يجب أن يتكون من 10 أحرف أو أرقام على الأقل	The code must contain at least 10 letters or digits
اختر كلمة مرور أو كودًا جديدًا	Choose a new password or code
أدخل كلمة المرور أو الكود الحالي بشكل صحيح	Enter the correct current password or code
الكود مستخدم لحساب آخر	Code already used by another account
يسجل الاستلام مسؤول الموقع فقط	Only the site representative may record receipts
تم تحديث الطلب من جهاز آخر. حدّث الصفحة وحاول مجددًا	Request updated on another device. Refresh and try again
تغير الطلب أثناء الحفظ. حدّث الصفحة	Request changed while saving. Refresh the page
تعذر حفظ العملية	Could not save the action
المشتريات	Procurement
متابعة المشتريات للمواقع	Site procurement tracking
لغة النظام	System language
كلمة المرور يجب أن تتكون من 10 أحرف أو أرقام على الأقل	Password must contain at least 10 letters or digits
تجهيز أوامر الشراء وبدء التوريد	Prepare purchase orders and start supply
مشاهدة طلبات جميع المواقع	View requests from all sites
مشاهدة الأسعار والقيم	View prices and values
حدّد الصلاحيات	Set permissions
صلاحيات غير صحيحة	Invalid permissions
بيانات المسميات غير صحيحة	Invalid label data
أدخل مسميات غير فارغة ضمن الحد المحدد	Enter non-empty labels within the allowed length
مسار	Masar
متابعة المشتريات	Procurement tracking
الطلبات	Requests
الموردون	Suppliers
المستخدمون والصلاحيات	Users and permissions
مزامنة Google Sheets	Google Sheets sync
قاعدة البيانات غير متاحة	Database unavailable
إعدادات الدخول غير مكتملة	Sign-in configuration is incomplete
سجّل الدخول أولًا	Sign in first
انتهت الجلسة، سجّل الدخول	Session expired. Sign in again
جلسة غير صحيحة	Invalid session
انتهت الجلسة	Session expired
تم تعطيل الجلسة، سجّل الدخول	Session disabled. Sign in again
تعذر الاتصال	Connection failed
جارٍ التحميل…	Loading…
`.trim().split('\n').map(line=>line.split('\t')));
const phrases=Object.keys(dictionary).filter(k=>k.length>1).sort((a,b)=>b.length-a.length);
export function translateString(value,locale=language){if(locale!=='en'||typeof value!=='string')return value;const trimmed=value.trim();if(dictionary[trimmed])return value.replace(trimmed,dictionary[trimmed]);let output=value;for(const key of phrases){if(output.includes(key))output=output.split(key).join(dictionary[key]);}return output;}
export function uiText(value){if(typeof value==='string')return translateString(value);return value;}
