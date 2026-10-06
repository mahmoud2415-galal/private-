'use client';
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type FormEvent } from 'react';
import { ArrowLeft, Check, ChevronDown, ClipboardList, Download, Eye, EyeOff, ImagePlus, LogOut, MapPin, PackageCheck, PanelRightClose, PanelRightOpen, Plus, Printer, RefreshCw, Search, Settings, ShieldCheck, ShoppingBag, Truck, Users, X } from 'lucide-react';
import { BusinessWorkspace } from '@/components/procurement/workspace';
import { BarChart3, Boxes, CreditCard, FileText, LayoutDashboard } from 'lucide-react';
import { uiText, getLanguage, subscribeLanguage, loadLanguage, setLanguage, translateString } from '@/lib/i18n.mjs';
import { readApiResponse, platformSignInMessage } from '@/lib/api-response.mjs';
import { defaultLabels, labelLimits } from '@/lib/branding.mjs';
type Labels = typeof defaultLabels;
type Branding = {
    labels: Labels;
    revision: number;
};
const BrandingContext = createContext<{
    branding: Branding;
    setBranding: (value: Branding) => void;
}>({ branding: { labels: defaultLabels, revision: 0 }, setBranding: () => { } });
export type User = {
    id: string;
    role: string;
    name: string;
    active: number;
    permissions: Record<string, boolean>;
};
type Item = {
    name: string;
    spec: string;
    unit: string;
    qty: number | string;
    approved?: number;
    price?: number;
    received?: number;
};
type Supplier = {
    id: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    active: number;
};
export type Site = {
    id: string;
    name: string;
    active: number;
};
export type Purchase = {
    id: string;
    seq: number;
    site_id: string;
    state: string;
    created: string;
    updated: string;
    revision: number;
    data: {
        requester: string;
        reason: string;
        priority: string;
        siteName: string;
        items: Item[];
        supplier: Partial<Supplier> | null;
        reviewNote: string;
        order: {
            number: string;
            expected: string;
            at: string;
        } | null;
        history: {
            at: string;
            event: string;
            by: string;
            note?: string;
        }[];
        receipts: {
            id: string;
            at: string;
            note: string;
            quantities: number[];
            by: string;
        }[];
    };
};
type Snapshot = {
    branding: Branding;
    users: User[];
    syncEnabled: boolean;
    sync: {
        last_success: string;
        last_error: string;
        line_count: number;
    } | null;
    user: User;
    requests: Purchase[];
    sites: Site[];
    suppliers: Supplier[];
    stats: {
        state: string;
        count: number;
        value?: number;
        approvedValue?: number;
    }[];
    more: boolean;
};
const states: Record<string, string> = { new: 'بانتظار المراجعة', needs_revision: 'مطلوب تعديل', approved: 'معتمد', rejected: 'مرفوض', ordered: 'قيد التوريد', partial: 'استلام جزئي', received: 'تم الاستلام', cancelled: 'ملغي' };
const money = (n: number) => new Intl.NumberFormat(getLanguage() === 'en' ? 'en-GB' : 'ar', { maximumFractionDigits: 2 }).format(n);
const date = (s: string) => s ? new Intl.DateTimeFormat(getLanguage() === 'en' ? 'en-GB' : 'ar', { dateStyle: 'medium' }).format(new Date(s)) : '—';
const ref = (r: Purchase) => `PR-${String(r.seq).padStart(6, '0')}`;
const blank = (): Item => ({ name: '', spec: '', qty: '', unit: 'قطعة' });
async function api<T = Snapshot>(body?: Record<string, unknown>, query = '') { const r = await fetch('/api/purchases' + query, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'same-origin', redirect: 'manual' }); return await readApiResponse(r) as T; }
function Badge({ state }: {
    state: string;
}) { return <span className={`badge b-${state}`}>{uiText(states[state] || state)}</span>; }
function Field({ label, children, hint }: {
    label: string;
    children: ReactNode;
    hint?: string;
}) { return <label className="field"><span>{uiText(label)}</span>{uiText(children)}{uiText(hint && <small>{uiText(hint)}</small>)}</label>; }
function Modal({ title, close, children, wide = false }: {
    title: string;
    close: () => void;
    children: ReactNode;
    wide?: boolean;
}) { const box = useRef<HTMLDivElement>(null), closing = useRef(close); closing.current = close; useEffect(() => { const previous = document.activeElement as HTMLElement; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; box.current?.focus(); const key = (e: KeyboardEvent) => { if (e.key === 'Escape')
    closing.current(); if (e.key === 'Tab') {
    const nodes = box.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([tabindex="-1"]),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]');
    if (!nodes?.length)
        return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
        e.preventDefault();
        last.focus();
    }
    else if (!e.shiftKey && (document.activeElement === last || document.activeElement === box.current)) {
        e.preventDefault();
        first.focus();
    }
} }; document.addEventListener('keydown', key); return () => { document.body.style.overflow = old; document.removeEventListener('keydown', key); previous?.focus(); }; }, []); return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget)
    close(); }}><div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={uiText(title)} className={`modal ${wide ? 'wide' : ''}`}><header><h2>{uiText(title)}</h2><button className="icon-button" aria-label={uiText("إغلاق")} onClick={close}><X size={20}/></button></header>{uiText(children)}</div></div>; }
function ErrorBox({ message }: {
    message: string;
}) { return message ? <div className="error" role="alert"><p>{uiText(message)}</p>{uiText(message === platformSignInMessage && <a className="button primary" href="/">{uiText("\u062A\u062C\u062F\u064A\u062F \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0639")}</a>)}</div> : null; }
const systemSheetUrl = 'https://docs.google.com/spreadsheets/d/1zWv1qtbG1NtmfZmCyCWvkOlX-prmZ9Cv5uZJmCl4xdc/edit?gid=950223352#gid=950223352';
function SheetLink() {
    const [copied, setCopied] = useState(false), [showLink, setShowLink] = useState(false);
    async function copyLink() { try {
        await navigator.clipboard.writeText(systemSheetUrl);
        setCopied(true);
        setShowLink(false);
    }
    catch {
        setCopied(false);
        setShowLink(true);
    } }
    return <div className="sheet-link"><div className="sheet-link-actions"><a className="button primary" href={systemSheetUrl} target="_top">{uiText("\u0641\u062A\u062D \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0641\u064A Google Sheets")}<ArrowLeft size={17}/></a><button type="button" className="button light" onClick={copyLink}>{uiText(copied ? <Check size={17}/> : <ClipboardList size={17}/>)}{uiText("\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637")}</button></div><p className="inline-note">{uiText("\u0625\u0630\u0627 \u0644\u0645 \u064A\u0641\u062A\u062D \u0627\u0644\u0634\u064A\u062A \u0645\u0646 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u060C \u0627\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0627\u0641\u062A\u062D\u0647 \u0641\u064A Chrome \u0623\u0648 Safari \u0628\u062D\u0633\u0627\u0628 Google \u0627\u0644\u0630\u064A \u064A\u0645\u0644\u0643 \u0627\u0644\u0645\u0644\u0641.")}</p>{uiText(copied && <p role="status" className="inline-note">{uiText("\u062A\u0645 \u0646\u0633\u062E \u0631\u0627\u0628\u0637 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645.")}</p>)}{uiText(showLink && <Field label={uiText("رابط بيانات النظام")} hint={uiText("اضغط مطولًا على الرابط لنسخه، ثم الصقه في متصفح هاتفك.")}><input type="text" dir="ltr" readOnly value={systemSheetUrl} onFocus={e => e.currentTarget.select()}/></Field>)}</div>;
}
export default function Page() {
    const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => 'ar');
    useEffect(() => { loadLanguage(); }, []);
    useEffect(() => { document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; }, [language]);
    const [branding, setBranding] = useState<Branding>({ labels: defaultLabels, revision: 0 });
    useEffect(() => { const controller = new AbortController(); fetch('/api/branding', { cache: 'no-store', signal: controller.signal }).then(async (response) => { if (!response.ok)
        return; const value = await response.json() as Branding; setBranding(old => old.revision > value.revision ? old : value); }).catch(() => { }); return () => controller.abort(); }, []);
    useEffect(() => { document.title = translateString(branding.labels.systemName) + ' | ' + translateString(branding.labels.systemSubtitle); }, [branding, language]);
    return <BrandingContext.Provider value={{ branding, setBranding }}><ProcurementPage /></BrandingContext.Provider>;
}
function ProcurementPage() {
    const { branding, setBranding } = useContext(BrandingContext), labels = branding.labels;
    const [snap, setSnap] = useState<Snapshot | null>(null), [ready, setReady] = useState(false), [error, setError] = useState(''), [tab, setTab] = useState('dashboard'), [state, setState] = useState(''), [site, setSite] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [search, setSearch] = useState(''), [busy, setBusy] = useState(false), [selected, setSelected] = useState<Purchase | null>(null), [form, setForm] = useState<Purchase | 'new' | null>(null), [supplierForm, setSupplierForm] = useState<Supplier | 'new' | null>(null), [siteForm, setSiteForm] = useState<User | null>(null), [toast, setToast] = useState(''), [lastSync, setLastSync] = useState(''), [printOrder, setPrintOrder] = useState<Purchase | null>(null), [wideMode, setWideMode] = useState(false);
    const generation = useRef(0);
    const query = () => '?state=' + encodeURIComponent(state) + '&site=' + encodeURIComponent(site) + '&from=' + from + '&to=' + to;
    async function refresh(more = false, silent = false) { const epoch = ++generation.current; if (!silent)
        setBusy(true); try {
        const data: Snapshot = await api(undefined, query() + (more ? '&offset=' + snap!.requests.length : ''));
        if (epoch !== generation.current)
            return;
        setBranding(data.branding);
        if (!snap && data.user.role === 'site') {
            setTab('requests');
            try {
                if (sessionStorage.getItem('purchase-draft:' + data.user.id + ':new'))
                    setTab('new-request');
            }
            catch { }
        }
        setSnap(old => more && old ? { ...data, requests: [...old.requests, ...data.requests] } : data);
        setLastSync(new Date().toLocaleTimeString(getLanguage() === 'en' ? 'en-GB' : 'ar', { hour: '2-digit', minute: '2-digit' }));
        setError('');
    }
    catch (e) {
        if (epoch !== generation.current)
            return;
        const err = e as Error & {
            status?: number;
        };
        if (err.status === 401) {
            setSnap(null);
            setSelected(null);
            setForm(null);
            setSupplierForm(null);
            setSiteForm(null);
            setPrintOrder(null);
            setToast('');
            setTab('dashboard');
        }
        else if (!silent)
            setError(err.message);
    }
    finally {
        if (epoch === generation.current) {
            setBusy(false);
            setReady(true);
        }
    } }
    useEffect(() => { void refresh(); }, [state, site, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (!snap)
        return; const timer = setInterval(() => { if (!document.hidden && tab !== 'new-request' && !form && !selected && !supplierForm && !siteForm)
        void refresh(false, true); }, 30000); return () => clearInterval(timer); }, [snap?.user.id, tab, state, site, from, to, form, selected, supplierForm, siteForm]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 6000); return () => clearTimeout(t); }, [toast]);
    async function saved(message = 'تم الحفظ') { setToast(message); await refresh(); }
    async function logout() { try {
        await api({ op: 'logout' });
        generation.current++;
        setSnap(null);
        setSelected(null);
        setForm(null);
        setState('');
        setSite('');
        setFrom('');
        setTo('');
        setTab('dashboard');
    }
    catch (e) {
        setError((e as Error).message);
    } }
    async function exportCSV() { setBusy(true); try {
        let offset = 0, all: Purchase[] = [];
        while (true) {
            const d: Snapshot = await api(undefined, '?offset=' + offset);
            all = all.concat(d.requests);
            if (!d.more)
                break;
            offset += 100;
        }
        const columns = ['رقم الطلب', 'التاريخ', 'الموقع', 'مقدم الطلب', 'الصنف', 'المواصفات', 'الكمية المطلوبة', 'الوحدة', 'الأولوية', 'السبب', 'الحالة', 'الكمية المعتمدة', 'المورد', 'سعر الوحدة المعتمد', 'الكمية المستلمة', 'قيمة المستلم', 'ملاحظات المراجعة', 'أمر الشراء', 'التوريد المتوقع'];
        const cell = (v: unknown) => { let s = String(v ?? ''); if (typeof v === 'string' && /^[\s]*[=+@-]/.test(s))
            s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
        const rows = all.flatMap(r => r.data.items.map(i => [ref(r), r.created.slice(0, 10), r.data.siteName, r.data.requester, i.name, i.spec, i.qty, i.unit, translateString(r.data.priority), r.data.reason, translateString(states[r.state]), i.approved, r.data.supplier?.name, i.price ?? '', i.received, i.price === undefined ? '' : Math.round((i.received || 0) * i.price * 100) / 100, r.data.reviewNote, r.data.order?.number, r.data.order?.expected]));
        download('\uFEFF' + [columns.map(v => translateString(v)), ...rows].map(row => row.map(cell).join(',')).join('\r\n'), 'سجل_المشتريات.csv', 'text/csv;charset=utf-8');
        setToast('تم تنزيل سجل المشتريات');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    if (!ready)
        return <div className="loading-page"><Logo /><p>{uiText("\u062C\u0627\u0631\u064D \u0641\u062A\u062D \u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A\u2026")}</p></div>;
    if (!snap)
        return <><ErrorBox message={error}/><Login onLogin={async () => { setState(''); setSite(''); await refresh(); }}/></>;
    const admin = snap.user.permissions.allSites;
    const can = (key: string) => snap.user.permissions[key] === true;
    const count = (...s: string[]) => snap.stats.filter(x => s.includes(x.state)).reduce((n, x) => n + x.count, 0);
    const total = snap.stats.reduce((n, x) => n + x.count, 0), receivedValue = snap.stats.reduce((n, x) => n + (x.value || 0), 0), approvedValue = snap.stats.reduce((n, x) => n + (x.approvedValue || 0), 0);
    const visible = snap.requests.filter(r => [ref(r), r.data.siteName, r.data.requester, ...r.data.items.map(x => x.name)].join(' ').toLowerCase().includes(search.toLowerCase()));
    const businessAccess = snap.user.role === 'admin';
    function navigate(value: string) { setTab(value); setState(''); setSite(''); setFrom(''); setTo(''); setSearch(''); }
    const pageName = ({ dashboard: 'الصفحة الرئيسية', requests: 'طلبات الشراء', orders: 'أوامر الشراء', invoices: 'فواتير الموردين', inventory: 'المخزون', accounts: 'الحسابات', reports: 'التقارير', 'new-request': 'طلب مشتريات', suppliers: 'إدارة الموردين', sync: labels.syncPage, settings: 'إعدادات النظام', sites: labels.usersPage } as Record<string, string>)[tab] || labels.requestsPage;
    return <div className={'app-shell' + (wideMode ? ' workspace-wide' : '')}>
 <aside className="sidebar" id="workspace-navigation"><Logo /><div className="workspace-label">{uiText(admin ? 'إدارة المشتريات' : 'مساحة الموقع')}</div><nav aria-label={uiText("التنقل الرئيسي")}>{uiText(businessAccess && <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard size={19}/>{uiText("\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629")}</button>)}<button className={tab === 'requests' ? 'active' : ''} onClick={() => navigate('requests')}><ClipboardList size={19}/>{uiText("\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621")}<span>{uiText(total)}</span></button>{uiText(businessAccess && <><button className={tab === 'orders' ? 'active' : ''} onClick={() => navigate('orders')}><PackageCheck size={19}/>{uiText("\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621")}</button><button className={tab === 'invoices' ? 'active' : ''} onClick={() => navigate('invoices')}><FileText size={19}/>{uiText("\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646")}</button></>)}{uiText(businessAccess && can('suppliers') && <button className={tab === 'suppliers' ? 'active' : ''} onClick={() => navigate('suppliers')}><Truck size={19}/>{uiText("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646")}</button>)}{uiText(businessAccess && <><button className={tab === 'inventory' ? 'active' : ''} onClick={() => navigate('inventory')}><Boxes size={19}/>{uiText("\u0627\u0644\u0645\u062E\u0632\u0648\u0646")}</button><button className={tab === 'accounts' ? 'active' : ''} onClick={() => navigate('accounts')}><CreditCard size={19}/>{uiText("\u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A")}</button><button className={tab === 'reports' ? 'active' : ''} onClick={() => navigate('reports')}><BarChart3 size={19}/>{uiText("\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631")}</button></>)}{uiText(snap.user.role === 'site' && <button className={tab === 'inventory' ? 'active' : ''} onClick={() => navigate('inventory')}><Boxes size={19}/>{uiText("\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0648\u0642\u0639")}</button>)}{uiText(can('create') && snap.user.role === 'site' && <button className={tab === 'new-request' ? 'active' : ''} onClick={() => navigate('new-request')}><Plus size={19}/>{uiText("\u0637\u0644\u0628 \u0645\u0634\u062A\u0631\u064A\u0627\u062A")}</button>)}{uiText(businessAccess && can('users') && <button className={tab === 'sites' ? 'active' : ''} onClick={() => navigate('sites')}><Users size={19}/>{uiText(labels.usersPage)}</button>)}{uiText(businessAccess && can('users') && <button className={tab === 'sync' ? 'active' : ''} onClick={() => navigate('sync')}><RefreshCw size={19}/>{uiText(labels.syncPage)}</button>)}{uiText(snap.user.id === 'admin' && snap.user.role === 'admin' && <button className={tab === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings size={19}/>{uiText("\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645")}</button>)}</nav><div className="sidebar-foot"><div className="avatar">{uiText(admin ? <ShieldCheck size={21}/> : <MapPin size={21}/>)}</div><div><strong>{snap.user.name}</strong><small>{uiText(admin ? 'صلاحيات المدير' : 'مسؤول الموقع')}</small></div><button aria-label={uiText("تسجيل الخروج")} className="icon-button" onClick={logout}><LogOut size={18}/></button></div></aside>
 <main className="main"><header className="topbar"><div className="page-heading"><div className="page-path"><span>{uiText(labels.systemName)}</span><ArrowLeft size={12}/><span>{uiText(pageName)}</span></div><h1>{uiText(pageName)}</h1></div><div className="top-actions"><LanguagePicker /><div className="account-chip"><MapPin size={16}/><span>{snap.user.name}</span></div><button className="button light workspace-toggle" onClick={() => setWideMode(v => !v)} aria-controls="workspace-navigation" aria-expanded={!wideMode} title={uiText(wideMode ? 'إظهار القائمة الجانبية' : 'توسيع مساحة العمل')}>{uiText(wideMode ? <PanelRightOpen size={18}/> : <PanelRightClose size={18}/>)}<span>{uiText(wideMode ? 'إظهار القائمة' : 'توسيع المساحة')}</span></button><button className="button light" disabled={busy} onClick={() => refresh()} aria-label={uiText("تحديث البيانات")}><RefreshCw size={17} className={busy ? 'spin' : ''}/><span>{uiText("\u062A\u062D\u062F\u064A\u062B")}</span></button>{uiText(tab === 'requests' && can('create') && snap.user.role === 'site' && <button className="button primary" onClick={() => setTab('new-request')}><Plus size={18}/>{uiText("\u0637\u0644\u0628 \u062C\u062F\u064A\u062F")}</button>)}{uiText(tab === 'suppliers' && <button className="button primary" onClick={() => setSupplierForm('new')}><Plus size={18}/>{uiText("\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0631\u062F")}</button>)}</div></header>
 <ErrorBox message={error}/>
 {uiText(((businessAccess && ['dashboard', 'orders', 'invoices', 'inventory', 'accounts', 'reports'].includes(tab)) || (snap.user.role === 'site' && tab === 'inventory')) && <BusinessWorkspace key={tab} tab={tab} user={snap.user} sites={snap.sites} stats={snap.stats} trigger={snap} onRequest={setSelected} onNavigate={navigate} renderFiles={(r, id, onBusy) => <InvoiceFiles request={r} user={snap.user} invoiceId={id} onBusy={onBusy}/>}/>)}
 {uiText(tab === 'dashboard' && !businessAccess && <><div className="dashboard-welcome"><div><span>{snap.user.name}</span><h2>{uiText("\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u0648\u0642\u0639")}</h2><p>{uiText("\u0633\u062C\u0651\u0644 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u062A\u0627\u0628\u0639 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0648\u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645.")}</p></div><LayoutDashboard size={36}/></div><div className="stats-grid"><Metric title={uiText("بانتظار المراجعة")} value={count('new', 'needs_revision')} icon={<ClipboardList size={20}/>} color="amber"/><Metric title={uiText("معتمد ولم يكتمل")} value={count('approved', 'ordered', 'partial')} icon={<Truck size={20}/>} color="blue"/><Metric title={uiText("تم الاستلام")} value={count('received')} icon={<PackageCheck size={20}/>} color="green"/><Metric title={uiText("إجمالي الطلبات")} value={total} icon={<ShoppingBag size={20}/>} color="blue"/></div><div className="table-actions">{uiText(can('create') && <button className="button primary" onClick={() => navigate('new-request')}><Plus size={18}/>{uiText("\u0637\u0644\u0628 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u062C\u062F\u064A\u062F")}</button>)}<button className="button light" onClick={() => navigate('requests')}>{uiText("\u0645\u062A\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639")}</button></div></>)}
 {uiText(tab === 'new-request' && can('create') && snap.user.role === 'site' && <section className="panel request-page"><div className="panel-heading"><div><h2>{uiText("\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639")}</h2><p>{uiText("\u0633\u062C\u0651\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0627\u062C\u0647\u0627 \u0641\u064A \u0637\u0644\u0628 \u0648\u0627\u062D\u062F\u060C \u062B\u0645 \u0623\u0631\u0633\u0644\u0647\u0627 \u0644\u0644\u0645\u062F\u064A\u0631.")}</p></div><ShoppingBag size={24}/></div><div className="request-site"><MapPin size={18}/><strong>{snap.user.name}</strong><span>{uiText("\u064A\u064F\u0631\u0628\u0637 \u0627\u0644\u0637\u0644\u0628 \u0628\u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627")}</span></div><RequestForm userId={snap.user.id} request={null} inline close={() => setTab('requests')} onSaved={async () => { setTab('requests'); setState(''); setSite(''); setFrom(''); setTo(''); setSearch(''); await saved('تم إرسال طلب المشتريات للمدير للمراجعة'); }}/></section>)}
 {uiText(tab === 'requests' && <><div className="section-intro"><p>{uiText(admin ? 'راجع احتياجات المواقع، وحدد المورد، وتابع التوريد حتى الاستلام.' : 'أرسل احتياجات موقعك، وتابع قرار المدير، وسجّل الكميات عند وصولها.')}</p><small className="sync"><span />{uiText("\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B ")}{uiText(lastSync)}</small></div>
 <div className="stats-grid"><Metric title={uiText("بانتظار المراجعة")} value={count('new', 'needs_revision')} icon={<ClipboardList size={20}/>} color="amber"/><Metric title={uiText("معتمد ولم يكتمل")} value={count('approved', 'ordered', 'partial')} icon={<Truck size={20}/>} color="blue"/><Metric title={uiText("تم الاستلام")} value={count('received')} icon={<PackageCheck size={20}/>} color="green"/><Metric title={uiText("مرفوض")} value={count('rejected')} icon={<X size={20}/>} color="rose"/></div>
 {uiText(can('prices') && <div className="value-banner"><span><ShoppingBag size={19}/>{uiText("\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629")}</span><strong>{uiText(money(approvedValue))} <small>{uiText("\u0628\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627")}</small></strong><small>{uiText("\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0644\u0645 ")}{uiText(money(receivedValue))}{uiText(" \u00B7 \u0628\u062F\u0648\u0646 \u0636\u0631\u0627\u0626\u0628 \u0625\u0636\u0627\u0641\u064A\u0629")}</small></div>)}
 <section className="panel"><div className="panel-heading"><div><h2>{uiText(admin ? 'سجل الطلبات' : 'متابعة الطلبات')}</h2><p>{uiText("\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628 \u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A.")}</p></div><button className="button light export" disabled={busy} onClick={exportCSV}><Download size={16}/>{uiText("\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0643\u0644")}</button></div><div className="filters"><label className="search"><Search size={18}/><input aria-label={uiText("البحث في الطلبات المحملة")} placeholder={uiText("رقم الطلب، الصنف، مقدم الطلب…")} value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label={uiText("تصفية حسب الحالة")} value={state} onChange={e => setState(e.target.value)}><option value="">{uiText("\u0643\u0644 \u0627\u0644\u062D\u0627\u0644\u0627\u062A")}</option>{uiText(Object.entries(states).map(([k, v]) => <option key={k} value={k}>{uiText(v)}</option>))}</select>{uiText(admin && <select aria-label={uiText("تصفية حسب الموقع")} value={site} onChange={e => setSite(e.target.value)}><option value="">{uiText("\u0643\u0644 \u0627\u0644\u0645\u0648\u0627\u0642\u0639")}</option>{snap.sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>)}</div><div className="period-filters"><span>{uiText("\u062A\u0627\u0631\u064A\u062E \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628")}</span><label>{uiText("\u0645\u0646")}<input aria-label={uiText("تاريخ الطلب من")} type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></label><label>{uiText("\u0625\u0644\u0649")}<input aria-label={uiText("تاريخ الطلب إلى")} type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>{uiText((from || to) && <button className="text-button" onClick={() => { setFrom(''); setTo(''); }}>{uiText("\u0643\u0644 \u0627\u0644\u0641\u062A\u0631\u0629")}</button>)}</div>
 {uiText(snap.more && search && <p className="inline-note">{uiText("\u0627\u0644\u0628\u062D\u062B \u064A\u0634\u0645\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u062D\u0645\u0651\u0644\u0629. \u062D\u0645\u0651\u0644 \u0627\u0644\u0645\u0632\u064A\u062F \u0644\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0623\u0642\u062F\u0645.")}</p>)}
 {uiText(visible.length ? <><div className="request-table desktop-table"><table className="purchase-grid"><caption className="sr-only">{uiText("\u0633\u062C\u0644 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A")}</caption><thead><tr><th scope="col">{uiText("\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628")}</th><th scope="col">{uiText("\u0627\u0644\u0645\u0648\u0642\u0639 / \u0645\u0642\u062F\u0645 \u0627\u0644\u0637\u0644\u0628")}</th><th scope="col">{uiText("\u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629")}</th><th scope="col">{uiText("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0637\u0644\u0628")}</th><th scope="col">{uiText("\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629")}</th><th scope="col">{uiText("\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628")}</th><th scope="col">{uiText("\u0627\u0644\u0625\u062C\u0631\u0627\u0621")}</th></tr></thead><tbody>{uiText(visible.map(r => <tr key={r.id} onClick={() => setSelected(r)}><td><button className="request-ref" onClick={e => { e.stopPropagation(); setSelected(r); }}><span className="mono">{uiText(ref(r))}</span></button></td><td><strong>{r.data.siteName}</strong><small>{r.data.requester}</small></td><td><strong className="item-name" title={uiText(r.data.items.map(i => i.name).join('، '))}>{r.data.items[0]?.name}</strong><small>{uiText(money(r.data.items.length))}{uiText(" \u0635\u0646\u0641")}</small></td><td className="date-cell">{uiText(date(r.created))}</td><td><span className={'request-priority ' + (r.data.priority === 'عادية' ? 'normal' : 'urgent')}>{uiText(r.data.priority)}</span></td><td><Badge state={r.state}/></td><td><button className="button light row-details" aria-label={uiText('عرض تفاصيل ' + ref(r))} onClick={e => { e.stopPropagation(); setSelected(r); }}>{uiText("\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644")}<ArrowLeft size={15}/></button></td></tr>))}</tbody></table></div><div className="mobile-requests">{uiText(visible.map(r => <button key={r.id} className="mobile-request" onClick={() => setSelected(r)}><div><b className="mono">{uiText(ref(r))}</b><Badge state={r.state}/></div><strong>{r.data.items[0]?.name}</strong><p>{r.data.siteName} · {uiText(r.data.items.length)}{uiText(" \u0635\u0646\u0641")}</p><small>{uiText(date(r.created))}<ArrowLeft size={17}/></small></button>))}</div></> : <Empty icon={<ClipboardList size={30}/>} title={uiText(search || state || site ? 'لا توجد طلبات تطابق البحث' : 'ابدأ بأول طلب')} text={uiText(search || state || site ? 'جرّب تغيير البحث أو التصفية.' : admin ? 'عندما يرسل مسؤول الموقع طلبًا سيظهر هنا للمراجعة.' : 'أضف الأصناف والكميات المطلوبة، وسيراجعها المدير.')} action={can('create') && snap.user.role === 'site' && !state && !search ? <button className="button primary" onClick={() => setTab('new-request')}><Plus size={17}/>{uiText("\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628")}</button> : undefined}/>)}
 {uiText(snap.more && <div className="load-more"><button className="button light" disabled={busy} onClick={() => refresh(true)}><ChevronDown size={17}/>{uiText("\u062A\u062D\u0645\u064A\u0644 \u0637\u0644\u0628\u0627\u062A \u0623\u0642\u062F\u0645")}</button></div>)}<footer className="panel-footer">{uiText(snap.requests.length)}{uiText(" \u0637\u0644\u0628 \u0645\u062D\u0645\u0651\u0644 \u00B7 \u0627\u0644\u0645\u0644\u062E\u0635 \u064A\u0634\u0645\u0644 \u0637\u0644\u0628\u0627\u062A ")}{uiText(admin ? 'المواقع' : 'موقعك')}{uiText(from || to ? ' التي أنشئت خلال الفترة المحددة' : ' خلال كل الفترة')}</footer></section>
 </>)}
 {uiText(tab === 'suppliers' && <><p className="section-intro">{uiText("\u0627\u062D\u062A\u0641\u0638 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644\u060C \u0648\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0648\u0631\u062F \u0623\u062B\u0646\u0627\u0621 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0637\u0644\u0628.")}</p><div className="entity-grid">{uiText(snap.suppliers.map(s => <button key={s.id} className="entity-card" onClick={() => setSupplierForm(s)}><div className="entity-top"><span className="entity-icon"><Truck size={22}/></span><span className={`badge ${s.active ? 'b-received' : 'b-cancelled'}`}>{uiText(s.active ? 'نشط' : 'موقوف')}</span></div><h2>{s.name}</h2><p dir="auto">{uiText(s.phone || 'لم يسجل هاتف')}</p><small dir="auto">{uiText(s.email || 'لم يسجل بريد')}</small><span className="card-link">{uiText("\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0648\u0631\u062F ")}<ArrowLeft size={16}/></span></button>))}</div>{uiText(!snap.suppliers.length && <Empty icon={<Truck size={30}/>} title={uiText("أضف المورد الأول")} text={uiText("تحتاج موردًا نشطًا لاعتماد الطلبات وتجهيز أوامر الشراء.")} action={<button className="button primary" onClick={() => setSupplierForm('new')}><Plus size={17}/>{uiText("\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0631\u062F")}</button>}/>)}</>)}
 {uiText(tab === 'sites' && <><div className="section-intro"><p>{uiText("\u0639\u062F\u0651\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631\u060C \u0648\u062D\u062F\u062F \u0635\u0644\u0627\u062D\u064A\u0629 \u0643\u0644 \u062D\u0633\u0627\u0628.")}</p></div><div className="notice"><ShieldCheck size={20}/><p>{uiText("\u062A\u0637\u0628\u0651\u0642 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0639\u062F \u0627\u0644\u062D\u0641\u0638. \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u0628\u0637\u0644 \u0627\u0644\u0643\u0648\u062F \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0648\u064A\u0646\u0647\u064A \u062C\u0644\u0633\u0627\u062A\u0647 \u0627\u0644\u0623\u062E\u0631\u0649.")}</p></div><div className="entity-grid">{uiText(snap.users.map(u => <button key={u.id} className="entity-card" onClick={() => setSiteForm(u)}><div className="entity-top"><span className="entity-icon">{uiText(u.role === 'admin' ? <ShieldCheck size={22}/> : <MapPin size={22}/>)}</span><span className={`badge ${u.active ? 'b-received' : 'b-cancelled'}`}>{uiText(u.active ? 'الدخول مفعّل' : 'الدخول موقوف')}</span></div><small className="mono">{uiText(u.id)}</small><h2>{u.name}</h2><p>{uiText(u.role === 'admin' ? 'الحساب الرئيسي — جميع صلاحيات الإدارة' : Object.entries(permissionNames).filter(([k]) => u.permissions[k]).map(([, v]) => v).join('، ') || 'مشاهدة طلبات الموقع فقط')}</p><span className="card-link">{uiText("\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ")}<ArrowLeft size={16}/></span></button>))}</div></>)}
 {uiText(tab === 'sync' && <section className="panel sync-panel"><div className="panel-heading"><div><h2>{uiText("\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0625\u0644\u0649 \u0627\u0644\u0634\u064A\u062A")}</h2><p>{uiText("\u0646\u0633\u062E\u0629 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u062A\u064F\u062D\u062F\u0651\u062B \u0643\u0644 \u0633\u0627\u0639\u0629.")}</p></div><RefreshCw size={23}/></div><div className="form-body"><div className="notice"><ShieldCheck size={20}/><p>{uiText("\u0627\u0639\u0645\u0644 \u062F\u0627\u062E\u0644 \u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645. \u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0641\u064A \u0635\u0641\u062D\u0629 \u00AB\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645\u00BB \u0641\u064A \u0627\u0644\u0634\u064A\u062A. \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u062F\u0627\u062E\u0644 \u0627\u0644\u0634\u064A\u062A \u0644\u0627 \u064A\u0639\u0648\u062F \u0625\u0644\u0649 \u0627\u0644\u0646\u0638\u0627\u0645.")}</p></div><div className="detail-info"><div><small>{uiText("\u0622\u062E\u0631 \u0645\u0632\u0627\u0645\u0646\u0629 \u0646\u0627\u062C\u062D\u0629")}</small><strong>{uiText(snap.sync?.last_success ? new Date(snap.sync.last_success).toLocaleString(getLanguage() === 'en' ? 'en-GB' : 'ar') : 'بانتظار أول مزامنة')}</strong></div><div><small>{uiText("\u0628\u0646\u0648\u062F \u0646\u064F\u0642\u0644\u062A")}</small><strong>{uiText(snap.sync?.line_count ?? 0)}</strong></div><div><small>{uiText("\u0627\u0644\u062A\u062D\u062F\u064A\u062B")}</small><strong>{uiText("\u062A\u0644\u0642\u0627\u0626\u064A \u0643\u0644 \u0633\u0627\u0639\u0629")}</strong></div></div>{uiText(snap.sync?.last_error && <ErrorBox message={'تعذر آخر تحديث: ' + snap.sync.last_error}/>)}<SheetLink /><p className="inline-note">{uiText("\u0642\u062F \u064A\u062A\u0623\u062E\u0631 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0642\u0644\u064A\u0644\u064B\u0627 \u0623\u0648 \u064A\u062A\u0648\u0642\u0641 \u0625\u0630\u0627 \u0627\u0646\u0642\u0637\u0639 \u0627\u062A\u0635\u0627\u0644 Google. \u064A\u0638\u0647\u0631 \u0648\u0642\u062A \u0622\u062E\u0631 \u0646\u062C\u0627\u062D \u0623\u0639\u0644\u0627\u0647.")}</p></div></section>)}
 {uiText(tab === 'settings' && snap.user.id === 'admin' && snap.user.role === 'admin' && <SystemSettings branding={branding} onSaved={async (value) => { setBranding(value); await saved('تم حفظ اسم النظام ومسميات الصفحات'); }}/>)}
 <footer className="app-footer"><span>{uiText(labels.systemName)} · {uiText(labels.systemSubtitle)}</span><span>{uiText("\u062A\u064F\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0628\u0639\u062F \u062A\u0623\u0643\u064A\u062F \u0643\u0644 \u0639\u0645\u0644\u064A\u0629")}</span></footer>
 </main>
 {uiText(form && <RequestForm userId={snap.user.id} request={form === 'new' ? null : form} close={() => setForm(null)} onSaved={async () => { setForm(null); setSelected(null); await saved('تم إرسال الطلب للمراجعة'); }}/>)}
 {uiText(selected && <RequestDetail request={selected} user={snap.user} suppliers={snap.suppliers} close={() => setSelected(null)} onSaved={async (r: Purchase) => { setSelected(r); await saved(); }} onEdit={() => { setForm(selected); setSelected(null); }} onPrint={() => { setPrintOrder(selected); setSelected(null); }}/>)}
 {uiText(supplierForm && <SupplierForm supplier={supplierForm === 'new' ? null : supplierForm} close={() => setSupplierForm(null)} onSaved={async () => { setSupplierForm(null); await saved(); }}/>)}
 {uiText(siteForm && <UserForm user={siteForm} self={snap.user.id === siteForm.id} close={() => setSiteForm(null)} onSaved={async () => { await saved('تم تحديث بيانات المستخدم'); }}/>)}
 {uiText(printOrder && <OrderPreview request={printOrder} close={() => setPrintOrder(null)}/>)}
 {uiText(toast && <div className="toast" role="status"><Check size={18}/>{uiText(toast)}</div>)}
 </div>;
}
function SystemSettings({ branding, onSaved }: {
    branding: Branding;
    onSaved: (value: Branding) => Promise<void>;
}) {
    const [draft, setDraft] = useState<Labels>({ ...branding.labels }), [revision, setRevision] = useState(branding.revision), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
    const fields: {
        key: keyof Labels;
        label: string;
    }[] = [{ key: 'systemName', label: 'اسم النظام' }, { key: 'systemSubtitle', label: 'الوصف المختصر تحت اسم النظام' }, { key: 'requestsPage', label: 'اسم صفحة الطلبات' }, { key: 'suppliersPage', label: 'اسم صفحة الموردين' }, { key: 'usersPage', label: 'اسم صفحة المستخدمين والصلاحيات' }, { key: 'syncPage', label: 'اسم صفحة مزامنة Google Sheets' }];
    return <section className="panel settings-panel"><div className="panel-heading"><div><h2>{uiText("\u0627\u0633\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0645\u0633\u0645\u064A\u0627\u062A \u0627\u0644\u0635\u0641\u062D\u0627\u062A")}</h2><p>{uiText("\u0627\u0643\u062A\u0628 \u0627\u0644\u0645\u0633\u0645\u064A\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u0631\u064A\u062F \u0623\u0646 \u062A\u0638\u0647\u0631 \u0644\u0643 \u0648\u0644\u0645\u0633\u0624\u0648\u0644\u064A \u0627\u0644\u0645\u0648\u0627\u0642\u0639.")}</p></div><Settings size={23}/></div><form onSubmit={async (e) => { e.preventDefault(); setError(''); setSuccess(''); setBusy(true); try {
        const result = await api<{
            branding: Branding;
        }>({ op: 'settings', labels: draft, revision });
        setDraft(result.branding.labels);
        setRevision(result.branding.revision);
        await onSaved(result.branding);
        setSuccess('تم حفظ المسميات، وتظهر عند فتح النظام أو تحديثه.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }}><div className="form-body"><div className="form-grid">{uiText(fields.map(({ key, label }) => <Field key={key} label={uiText(label)}><input type="text" required disabled={busy} maxLength={labelLimits[key]} value={draft[key]} onChange={e => { setDraft(old => ({ ...old, [key]: e.target.value })); setSuccess(''); }}/></Field>))}</div><div className="settings-preview"><small>{uiText("\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0633\u0645 \u0627\u0644\u0646\u0638\u0627\u0645")}</small><strong>{uiText(draft.systemName || 'اسم النظام')}</strong><span>{uiText(draft.systemSubtitle)}</span></div><ErrorBox message={error}/>{uiText(success && <p className="inline-note" role="status">{uiText(success)}</p>)}</div><div className="modal-actions"><button className="button primary" disabled={busy}><Check size={17}/>{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ المسميات')}</button></div></form></section>;
}
function Logo() { const { branding } = useContext(BrandingContext); return <div className="logo"><span><ShoppingBag size={25}/></span><div><b>{uiText(branding.labels.systemName)}</b><small>{uiText(branding.labels.systemSubtitle)}</small></div></div>; }
function Metric({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: ReactNode;
    color: string;
}) { return <div className="metric"><div className={'metric-icon ' + color}>{uiText(icon)}</div><span>{uiText(title)}</span><strong>{uiText(money(value))}</strong></div>; }
function Empty({ icon, title, text, action }: {
    icon: ReactNode;
    title: string;
    text: string;
    action?: ReactNode;
}) { return <div className="empty"><div>{uiText(icon)}</div><h2>{uiText(title)}</h2><p>{uiText(text)}</p>{uiText(action)}</div>; }
function download(content: string, name: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function Login({ onLogin }: {
    onLogin: () => Promise<void>;
}) { const { branding } = useContext(BrandingContext); const [username, setUsername] = useState(''), [code, setCode] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''); async function login(e: FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
    await api({ op: 'login', code, username });
    setCode('');
    await onLogin();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} } return <div className="login-page"><section className="login-story"><Logo /><div className="login-story-content"><span className="story-tag">{uiText("\u0645\u0646 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C \u0625\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645")}</span><h1>{uiText("\u0643\u0644 \u0637\u0644\u0628.")}<br />{uiText("\u0641\u064A \u0645\u0633\u0627\u0631\u0647 \u0627\u0644\u0635\u062D\u064A\u062D.")}</h1><p>{uiText("\u0645\u0633\u0627\u062D\u0629 \u0648\u0627\u062D\u062F\u0629 \u062A\u062C\u0645\u0639 \u0645\u0633\u0624\u0648\u0644\u064A \u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u062E\u0637\u0648\u0629 \u0628\u062E\u0637\u0648\u0629.")}</p><div className="story-flow">{uiText([{ icon: <ClipboardList size={20}/>, n: '01', title: 'طلب من الموقع', text: 'الأصناف والمواصفات والكميات' }, { icon: <ShieldCheck size={20}/>, n: '02', title: 'مراجعة واعتماد', text: 'الكمية والسعر والمورد المختار' }, { icon: <PackageCheck size={20}/>, n: '03', title: 'توريد واستلام', text: 'متابعة حتى وصول آخر صنف' }].map(x => <div key={x.n}><span>{uiText(x.icon)}</span><section><small>{uiText(x.n)}</small><b>{uiText(x.title)}</b><p>{uiText(x.text)}</p></section></div>))}</div></div><small className="story-footer">{uiText("\u0648\u0636\u0648\u062D \u0641\u064A \u0627\u0644\u0637\u0644\u0628 \u00B7 \u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0642\u0631\u0627\u0631")}</small></section><section className="login-form-wrap"><form className="login-form" onSubmit={login}><div className="login-icon"><Users size={26}/></div><span className="eyebrow">{uiText("\u0623\u0647\u0644\u064B\u0627 \u0628\u0643 \u0641\u064A ")}{uiText(branding.labels.systemName)}</span><LanguagePicker /><h2>{uiText("\u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0639\u0645\u0644")}</h2><p>{uiText("\u0623\u062F\u062E\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u060C \u0623\u0648 \u0627\u0633\u062A\u062E\u062F\u0645 \u0643\u0648\u062F\u0643 \u0627\u0644\u062D\u0627\u0644\u064A.")}</p><Field label={uiText("اسم المستخدم")} hint={uiText("مثل admin أو S01. يمكن تركه فارغًا عند استخدام الكود القديم.")}><input dir="ltr" autoComplete="username" maxLength={80} value={username} onChange={e => setUsername(e.target.value)} placeholder={uiText("admin / S01")}/></Field><Field label={uiText("كلمة المرور أو كود الدخول")}><div className="code-input"><input autoComplete="off" spellCheck={false} dir="ltr" type={show ? 'text' : 'password'} value={code} onChange={e => setCode(e.target.value)} placeholder={uiText("أدخل كلمة المرور أو الكود")} required maxLength={120}/><button type="button" aria-label={uiText(show ? 'إخفاء الكود' : 'إظهار الكود')} onClick={() => setShow(!show)}>{uiText(show ? <EyeOff size={19}/> : <Eye size={19}/>)}</button></div></Field><ErrorBox message={error}/><button className="button primary login-submit" disabled={busy}>{uiText(busy ? 'جارٍ التحقق…' : 'تسجل الدخول')}<ArrowLeft size={18}/></button><div className="login-help"><ShieldCheck size={17}/><p>{uiText("\u0643\u0648\u062F\u0643 \u064A\u062D\u062F\u062F \u0635\u0644\u0627\u062D\u064A\u0627\u062A\u0643. \u0625\u0630\u0627 \u0644\u0645 \u064A\u0643\u0646 \u0644\u062F\u064A\u0643 \u0643\u0648\u062F\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0645\u062F\u064A\u0631.")}</p></div></form><small className="login-bottom">{uiText("\u0645\u0635\u0645\u0645 \u0644\u0644\u0639\u0645\u0644 \u0645\u0646 \u0627\u0644\u062C\u0648\u0627\u0644 \u0648\u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631")}</small></section></div>; }
function LanguagePicker() { const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => 'ar'); return <div className="language-picker" role="group" aria-label={uiText(language === 'ar' ? 'لغة النظام' : 'System language')}><button type="button" className={language === 'ar' ? 'selected' : ''} aria-pressed={language === 'ar'} onClick={() => setLanguage('ar')}>{uiText("\u0627\u0644\u0639\u0631\u0628\u064A\u0629")}</button><button type="button" className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button></div>; }
function SessionRenew({ expectedUserId, onSuccess }: {
    expectedUserId: string;
    onSuccess: () => void;
}) { const [code, setCode] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); return <section className="session-renew"><h3>{uiText("\u062A\u062C\u062F\u064A\u062F \u062C\u0644\u0633\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0648\u0642\u0639")}</h3><p className="inline-note">{uiText("\u0623\u062F\u062E\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0623\u0648 \u0627\u0644\u0643\u0648\u062F \u0644\u0644\u062D\u0633\u0627\u0628 \u0646\u0641\u0633\u0647. \u0633\u062A\u0628\u0642\u0649 \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u0643\u062A\u0648\u0628\u0629 \u0643\u0645\u0627 \u0647\u064A.")}</p><Field label={uiText("كلمة المرور أو كود الدخول")}><input type="password" autoComplete="current-password" value={code} maxLength={120} onChange={e => setCode(e.target.value)}/></Field><button type="button" disabled={busy || !code} className="button primary" onClick={async () => { setBusy(true); setError(''); try {
    const d = await api<{
        user: User;
    }>({ op: 'login', username: expectedUserId, code });
    if (d.user.id !== expectedUserId)
        throw Error('يجب الدخول بحساب الموقع نفسه');
    setCode('');
    onSuccess();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}>{uiText(busy ? 'جارٍ تجديد الدخول…' : 'تجديد جلسة الحساب')}</button><ErrorBox message={error}/></section>; }
function RequestForm({ request, close, onSaved, inline = false, userId }: {
    userId: string;
    request: Purchase | null;
    close: () => void;
    onSaved: () => Promise<void>;
    inline?: boolean;
}) { const [requester, setRequester] = useState(request?.data.requester || ''), [priority, setPriority] = useState(request?.data.priority || 'عادية'), [reason, setReason] = useState(request?.data.reason || ''), [items, setItems] = useState<Item[]>(request ? request.data.items.map(({ name, spec, unit, qty }) => ({ name, spec, unit, qty })) : [blank()]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [sessionExpired, setSessionExpired] = useState(false), [draftReady, setDraftReady] = useState(false), [draftNotice, setDraftNotice] = useState(''); const token = useRef<string>(''); const draftKey = 'purchase-draft:' + userId + ':' + (request?.id || 'new'); useEffect(() => { try {
    const raw = sessionStorage.getItem(draftKey);
    if (raw) {
        const d = JSON.parse(raw);
        if (d.userId === userId && d.requestId === (request?.id || 'new') && Array.isArray(d.items) && d.items.length > 0 && d.items.length <= 50 && d.items.every((i: Item) => typeof i.name === 'string' && typeof i.spec === 'string' && typeof i.unit === 'string' && ['number', 'string'].includes(typeof i.qty))) {
            setRequester(d.requester || '');
            setPriority(['عادية', 'عاجلة', 'طارئة'].includes(d.priority) ? d.priority : 'عادية');
            setReason(d.reason || '');
            setItems(d.items);
            token.current = d.token || '';
            setDraftNotice('تم استعادة مسودة الطلب على هذا الجهاز. راجعها قبل الإرسال.');
        }
    }
}
catch { } setDraftReady(true); }, [draftKey]); useEffect(() => { if (!draftReady)
    return; try {
    sessionStorage.setItem(draftKey, JSON.stringify({ userId, requestId: request?.id || 'new', requester, priority, reason, items, token: token.current }));
}
catch {
    setDraftNotice('تعذر حفظ المسودة على هذا الجهاز. أبقِ الصفحة مفتوحة حتى تأكيد الإرسال.');
} }, [draftReady, draftKey, requester, priority, reason, items]); function change(i: number, key: keyof Item, value: string) { setItems(rows => rows.map((r, n) => n === i ? { ...r, [key]: value } : r)); } async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(''); if (!token.current)
    token.current = crypto.randomUUID(); try {
    sessionStorage.setItem(draftKey, JSON.stringify({ userId, requestId: request?.id || 'new', requester, priority, reason, items, token: token.current }));
}
catch { } try {
    await api(request ? { op: 'update', action: 'resubmit', id: request.id, revision: request.revision, requester, priority, reason, items } : { op: 'create', id: token.current, requester, priority, reason, items });
    try {
        sessionStorage.removeItem(draftKey);
    }
    catch { }
    await onSaved();
}
catch (e) {
    setError((e as Error).message);
    setSessionExpired((e as Error & {
        status?: number;
        code?: string;
    }).status === 401 && (e as Error & {
        code?: string;
    }).code !== 'SITE_AUTH_REQUIRED');
}
finally {
    setBusy(false);
} } const content = <form onSubmit={submit} aria-label={uiText("طلب مشتريات")}><fieldset disabled={busy} className="request-fields"><div className="form-body"><p className="muted">{uiText("\u062D\u062F\u062F \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0648\u0636\u0648\u062D\u060C \u062B\u0645 \u0623\u0631\u0633\u0644\u0647\u0627 \u0644\u0644\u0645\u062F\u064A\u0631 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629.")}</p>{uiText(draftNotice && <p className="inline-note" role="status">{uiText(draftNotice)}</p>)}<div className="form-grid"><Field label={uiText("اسم مقدم الطلب")}><input required maxLength={120} value={requester} onChange={e => setRequester(e.target.value)}/></Field><Field label={uiText("الأولوية")}><select value={priority} onChange={e => setPriority(e.target.value)}>{uiText(['عادية', 'عاجلة', 'طارئة'].map(x => <option key={x} value={x}>{uiText(x)}</option>))}</select></Field></div><Field label={uiText("سبب الطلب")}><textarea required maxLength={1000} rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder={uiText("لماذا يحتاج الموقع هذه الأصناف؟")}/></Field><div className="subheading"><h3>{uiText("\u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629")}</h3><span>{uiText(items.length)} / 50</span></div>{uiText(items.map((item, i) => <div className="item-form" key={i}><div className="item-header"><b>{uiText("\u0627\u0644\u0635\u0646\u0641 ")}{uiText(i + 1)}</b><button className="icon-button" type="button" aria-label={uiText('حذف الصنف ' + (i + 1))} disabled={items.length === 1 || busy} onClick={() => setItems(rows => rows.filter((_, n) => n !== i))}><X size={17}/></button></div><div className="form-grid item-grid"><Field label={uiText("اسم الصنف")}><input required maxLength={160} value={item.name} onChange={e => change(i, 'name', e.target.value)}/></Field><Field label={uiText("الكمية")}><input required type="number" min="0.000001" max="10000000" step="any" value={item.qty} onChange={e => change(i, 'qty', e.target.value)}/></Field><Field label={uiText("الوحدة")}><input required maxLength={40} value={item.unit} onChange={e => change(i, 'unit', e.target.value)}/></Field></div><Field label={uiText("المواصفات / ملاحظات الصنف")}><input maxLength={500} value={item.spec} onChange={e => change(i, 'spec', e.target.value)} placeholder={uiText("المقاس، النوع، الماركة أو أي تفاصيل…")}/></Field></div>))}<button className="button light" type="button" disabled={items.length >= 50 || busy} onClick={() => setItems(rows => [...rows, blank()])}><Plus size={17}/>{uiText("\u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641 \u0622\u062E\u0631")}</button><p className="inline-note">{uiText("\u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u062D\u062A\u0649 50 \u0635\u0646\u0641\u064B\u0627 \u0641\u064A \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0648\u0627\u062D\u062F. \u0631\u0627\u062C\u0639 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644.")}</p><ErrorBox message={error}/>{uiText(sessionExpired && <SessionRenew expectedUserId={userId} onSuccess={() => { setSessionExpired(false); setError('تم تجديد الدخول. اضغط إرسال طلب المشتريات لإكمال الإرسال.'); }}/>)}</div><div className="modal-actions"><button className="button primary" disabled={busy || sessionExpired || !draftReady}>{uiText(busy ? 'جارٍ الإرسال…' : 'إرسال طلب المشتريات')}<ArrowLeft size={17}/></button><button className="button light" type="button" disabled={busy} onClick={close}>{uiText("\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0633\u062C\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A")}</button></div></fieldset></form>; return inline ? content : <Modal title={uiText(request ? 'تعديل الطلب ' + ref(request) : 'طلب مشتريات جديد')} close={busy ? () => { } : close} wide>{uiText(content)}</Modal>; }
type InvoiceFile = {
    id: string;
    requestId: string;
    filename: string;
    mime: string;
    size: number;
    created: string;
};
function InvoiceFiles({ request: r, user, onBusy, invoiceId = '' }: {
    request: Purchase;
    user: User;
    onBusy: (busy: boolean) => void;
    invoiceId?: string;
}) {
    const own = user.role === 'site' && r.site_id === user.id, canRead = user.role === 'admin', canUpload = user.role === 'admin';
    const [files, setFiles] = useState<InvoiceFile[]>([]), [file, setFile] = useState<File | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(''), [preview, setPreview] = useState<InvoiceFile | null>(null);
    const picker = useRef<HTMLInputElement>(null), operation = useRef('');
    useEffect(() => { if (!canRead)
        return; const controller = new AbortController(); setLoading(true); fetch('/api/invoice-files?requestId=' + encodeURIComponent(r.id) + (invoiceId ? '&invoiceId=' + encodeURIComponent(invoiceId) : ''), { cache: 'no-store', signal: controller.signal }).then(async (response) => { const data = await readApiResponse(response) as {
        error?: string;
        files: InvoiceFile[];
    }; if (!response.ok)
        throw Error(data.error || 'تعذر تحميل الفواتير'); setFiles(data.files); setError(''); }).catch(e => { if (e.name !== 'AbortError')
        setError(e.message); }).finally(() => { if (!controller.signal.aborted)
        setLoading(false); }); return () => controller.abort(); }, [r.id, canRead, invoiceId]);
    function choose(value: File | null) { setError(''); setSuccess(''); setFile(null); operation.current = ''; if (!value)
        return; if (value.size > 3 * 1024 * 1024) {
        setError('اختر صورة بحجم لا يتجاوز 3 ميجابايت');
        return;
    } if (!['image/jpeg', 'image/png', 'image/webp'].includes(value.type)) {
        setError('اختر صورة JPG أو PNG أو WEBP');
        return;
    } setFile(value); operation.current = crypto.randomUUID(); }
    async function upload() { if (!file || busy)
        return; setBusy(true); onBusy(true); setError(''); setSuccess(''); try {
        const form = new FormData();
        form.set('requestId', r.id);
        if (invoiceId)
            form.set('invoiceId', invoiceId);
        form.set('id', operation.current);
        form.set('file', file);
        const response = await fetch('/api/invoice-files', { method: 'POST', body: form });
        const data = await readApiResponse(response) as {
            error?: string;
            file: InvoiceFile;
        };
        if (!response.ok)
            throw Error(data.error || 'تعذر رفع الفاتورة');
        setFiles(old => [data.file, ...old.filter(f => f.id !== data.file.id)]);
        setFile(null);
        operation.current = '';
        setSuccess(invoiceId ? 'تم حفظ الصورة على هذه الفاتورة.' : 'تم حفظ صورة الفاتورة على الطلب.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
        onBusy(false);
    } }
    if (!canRead)
        return null;
    return <section className="invoice-section"><div className="invoice-heading"><div><h3><ImagePlus size={20}/>{uiText("\u0635\u0648\u0631 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631")}</h3><p>{uiText(invoiceId ? 'ارفع صورة هذه الفاتورة لعرضها في الحسابات والتقارير.' : 'اربط صورة الفاتورة بهذا الطلب لعرضها والرجوع إليها لاحقًا.')}</p></div><span>{uiText(files.length)} / 20</span></div>{uiText(canUpload && <div className="invoice-upload"><input ref={picker} tabIndex={-1} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label={uiText("اختيار صورة الفاتورة")} disabled={busy} onChange={e => { choose(e.target.files?.[0] || null); e.target.value = ''; }}/><button type="button" className="button light" disabled={busy || loading || files.length >= 20} onClick={() => picker.current?.click()}><ImagePlus size={17}/>{uiText("\u0627\u062E\u062A\u064A\u0627\u0631 \u0635\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629")}</button>{uiText(file && <><span className="selected-file" title={uiText(file.name)}>{file.name}</span><button type="button" className="button primary" disabled={busy} onClick={upload}>{uiText(busy ? <RefreshCw className="spin" size={17}/> : <Plus size={17}/>)} {uiText(busy ? 'جارٍ الرفع…' : 'رفع وحفظ الصورة')}</button></>)}<small>{uiText("JPG \u00B7 PNG \u00B7 WEBP \u2014 \u062D\u062A\u0649 3 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A \u0644\u0644\u0635\u0648\u0631\u0629")}</small></div>)}<ErrorBox message={error}/>{uiText(success && <p className="invoice-success" role="status"><Check size={16}/>{uiText(success)}</p>)}{uiText(loading ? <p className="inline-note">{uiText("\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0635\u0648\u0631 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631\u2026")}</p> : !files.length && !error ? <p className="invoice-empty">{uiText("\u0644\u0645 \u062A\u064F\u0631\u0641\u0642 \u0635\u0648\u0631\u0629 \u0641\u0627\u062A\u0648\u0631\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0628\u0639\u062F.")}</p> : null)}<div className="invoice-grid">{uiText(files.map(f => <article className="invoice-card" key={f.id}><button type="button" className="invoice-thumb" onClick={() => setPreview(f)} aria-label={uiText('عرض ' + f.filename)}><img src={'/api/invoice-files?id=' + encodeURIComponent(f.id)} alt={'صورة الفاتورة ' + f.filename} loading="lazy"/></button><strong title={uiText(f.filename)}>{f.filename}</strong><small>{uiText(date(f.created))} · {uiText((f.size / 1024 / 1024).toFixed(2))} MB</small><div><button type="button" className="button light" onClick={() => setPreview(f)}><Eye size={16}/>{uiText("\u0639\u0631\u0636")}</button><a className="button light" href={'/api/invoice-files?id=' + encodeURIComponent(f.id) + '&download=1'} download><Download size={16}/>{uiText("\u062A\u0646\u0632\u064A\u0644")}</a></div></article>))}</div>{uiText(preview && <div className="invoice-preview"><div><strong>{preview.filename}</strong><button type="button" className="button light" onClick={() => setPreview(null)}><X size={16}/>{uiText("\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0635\u0648\u0631\u0629")}</button></div><img src={'/api/invoice-files?id=' + encodeURIComponent(preview.id)} alt={'صورة الفاتورة ' + preview.filename}/></div>)}</section>;
}
function RequestDetail({ request: r, user, suppliers, close, onSaved, onEdit, onPrint }: {
    request: Purchase;
    user: User;
    suppliers: Supplier[];
    close: () => void;
    onSaved: (r: Purchase) => Promise<void>;
    onEdit: () => void;
    onPrint: () => void;
}) {
    const admin = user.permissions.prices;
    const permitted = (key: string) => user.permissions[key] === true;
    const [quantities, setQuantities] = useState(r.data.items.map(i => String(r.state === 'approved' ? i.approved : i.qty))), [prices, setPrices] = useState(r.data.items.map(i => String(i.price || 0))), [supplier, setSupplier] = useState(r.data.supplier?.id || ''), [note, setNote] = useState(r.data.reviewNote || ''), [orderNumber, setOrderNumber] = useState('PO-' + ref(r)), [expected, setExpected] = useState(''), [receipt, setReceipt] = useState(r.data.items.map(() => '')), [receiptNote, setReceiptNote] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [cancel, setCancel] = useState(false), [cancelNote, setCancelNote] = useState('');
    const operation = useRef<string>('');
    useEffect(() => { setQuantities(r.data.items.map(i => String(r.state === 'approved' ? i.approved : i.qty))); setPrices(r.data.items.map(i => String(i.price || 0))); setSupplier(r.data.supplier?.id || ''); setNote(r.data.reviewNote || ''); setReceipt(r.data.items.map(() => '')); setReceiptNote(''); operation.current = ''; }, [r.revision]); // eslint-disable-line react-hooks/exhaustive-deps
    async function update(body: Record<string, unknown>) { setBusy(true); setError(''); try {
        const d = await api<{
            request: Purchase;
        }>({ op: 'update', id: r.id, revision: r.revision, ...body });
        await onSaved(d.request);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    const review = permitted('review') && ['new', 'needs_revision', 'approved'].includes(r.state);
    const incoming = permitted('receive') && r.site_id === user.id && ['ordered', 'partial'].includes(r.state);
    const approvedTotal = r.data.items.reduce((sum, i) => sum + (i.approved || 0) * (i.price || 0), 0);
    return <Modal title={uiText('تفاصيل ' + ref(r))} close={busy ? () => { } : close} wide><div className="form-body"><div className="detail-top"><div><Badge state={r.state}/>{uiText(['approved', 'ordered', 'partial', 'received'].includes(r.state) && r.data.items.some(i => (i.approved || 0) < Number(i.qty)) && <small className="partial-note">{uiText("\u0627\u0639\u062A\u0645\u0627\u062F \u062C\u0632\u0626\u064A \u0644\u0644\u0643\u0645\u064A\u0629")}</small>)}</div><span>{uiText(r.data.priority)} · {uiText(date(r.created))}</span></div><div className="detail-info"><div><small>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</small><strong>{r.data.siteName}</strong></div><div><small>{uiText("\u0645\u0642\u062F\u0645 \u0627\u0644\u0637\u0644\u0628")}</small><strong>{r.data.requester}</strong></div><div><small>{uiText("\u0627\u0644\u0645\u0648\u0631\u062F")}</small><strong>{uiText(r.data.supplier?.name || 'لم يحدد بعد')}</strong></div></div><div className="reason"><small>{uiText("\u0633\u0628\u0628 \u0627\u0644\u0637\u0644\u0628")}</small><p>{r.data.reason}</p></div>{uiText(r.data.reviewNote && <div className="notice"><ClipboardList size={18}/><p><b>{uiText("\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u062F\u064A\u0631")}</b><br />{uiText(r.data.reviewNote)}</p></div>)}
 <div className="subheading"><h3>{uiText("\u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0648\u0627\u0644\u0643\u0645\u064A\u0627\u062A")}</h3><span>{uiText(r.data.items.length)}{uiText(" \u0635\u0646\u0641")}</span></div><div className="items-summary">{uiText(r.data.items.map((i, n) => <div className="summary-item" key={n}><div><b>{i.name}</b><p>{uiText(i.spec || 'بدون مواصفات إضافية')}</p></div><div className="quantity-strip"><span>{uiText("\u0645\u0637\u0644\u0648\u0628 ")}<strong>{uiText(money(Number(i.qty)))}</strong></span><span>{uiText("\u0645\u0639\u062A\u0645\u062F ")}<strong>{uiText(money(i.approved || 0))}</strong></span><span>{uiText("\u0645\u0633\u062A\u0644\u0645 ")}<strong>{uiText(money(i.received || 0))}</strong></span><small>{uiText(i.unit)}</small></div>{uiText(admin && <small>{uiText("\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629: ")}{uiText(money(i.price || 0))}{uiText(" \u00B7 \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F: ")}{uiText(money((i.approved || 0) * (i.price || 0)))}</small>)}</div>))}</div>{uiText(admin && r.data.supplier && <p className="total-line">{uiText("\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 ")}<strong>{uiText(money(approvedTotal))}</strong></p>)}
 {uiText(review && <section className="action-section"><h3><ShieldCheck size={19}/>{uiText("\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0639\u062A\u0645\u0627\u062F")}</h3><p className="muted">{uiText("\u064A\u0645\u0643\u0646 \u0627\u0639\u062A\u0645\u0627\u062F \u062C\u0632\u0621 \u0645\u0646 \u0627\u0644\u0643\u0645\u064A\u0629. \u0623\u062F\u062E\u0644 \u0635\u0641\u0631\u064B\u0627 \u0644\u0644\u0635\u0646\u0641 \u063A\u064A\u0631 \u0627\u0644\u0645\u0639\u062A\u0645\u062F.")}</p><div className="review-items">{uiText(r.data.items.map((i, n) => <div key={n}><b>{i.name}<small>{uiText("\u0627\u0644\u0645\u0637\u0644\u0648\u0628 ")}{uiText(i.qty)} {uiText(i.unit)}</small></b><Field label={uiText("الكمية المعتمدة")}><input type="number" min={0} max={Number(i.qty)} step="any" value={quantities[n]} onChange={e => setQuantities(q => q.map((x, k) => k === n ? e.target.value : x))}/></Field><Field label={uiText("سعر الوحدة")}><input type="number" min={0} max={10000000} step="0.01" value={prices[n]} onChange={e => setPrices(q => q.map((x, k) => k === n ? e.target.value : x))}/></Field></div>))}</div><Field label={uiText("المورد المختار")}><select value={supplier} onChange={e => setSupplier(e.target.value)}><option value="">{uiText("\u0627\u062E\u062A\u0631 \u0645\u0648\u0631\u062F\u064B\u0627 \u0646\u0634\u0637\u064B\u0627")}</option>{suppliers.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{uiText(!suppliers.some(s => s.active) && <small>{uiText("\u0623\u0636\u0641 \u0645\u0648\u0631\u062F\u064B\u0627 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646 \u0642\u0628\u0644 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F.")}</small>)}</Field><Field label={uiText("ملاحظات القرار")}><textarea rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder={uiText("مطلوبة عند الرفض أو طلب التعديل")}/></Field><div className="action-buttons"><button className="button primary" disabled={busy} onClick={() => update({ action: 'review', decision: 'approve', items: quantities.map((approved, i) => ({ approved, price: prices[i] })), supplierId: supplier, note })}><Check size={17}/>{uiText("\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0643\u0645\u064A\u0627\u062A")}</button><button className="button light" disabled={busy} onClick={() => update({ action: 'review', decision: 'revise', note })}>{uiText("\u0637\u0644\u0628 \u062A\u0639\u062F\u064A\u0644")}</button><button className="button danger-light" disabled={busy} onClick={() => update({ action: 'review', decision: 'reject', note })}>{uiText("\u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628")}</button></div></section>)}
 {uiText(permitted('dispatch') && r.state === 'approved' && <form className="action-section" onSubmit={e => { e.preventDefault(); void update({ action: 'dispatch', orderNumber, expected }); }}><h3><Truck size={19}/>{uiText("\u062A\u062C\u0647\u064A\u0632 \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621")}</h3><p className="muted">{uiText("\u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0648\u0631\u064A\u062F \u062B\u0645 \u0627\u0637\u0628\u0639 \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0648\u0623\u0631\u0633\u0644\u0647 \u0628\u0646\u0641\u0633\u0643 \u0644\u0644\u0645\u0648\u0631\u062F.")}</p><div className="form-grid"><Field label={uiText("رقم أمر الشراء")}><input required maxLength={80} value={orderNumber} onChange={e => setOrderNumber(e.target.value)} dir="auto"/></Field><Field label={uiText("تاريخ التوريد المتوقع")}><input type="date" value={expected} onChange={e => setExpected(e.target.value)}/></Field></div><button className="button primary" disabled={busy}><Truck size={17}/>{uiText("\u0628\u062F\u0621 \u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0623\u0645\u0631")}</button></form>)}
 {uiText(r.data.order && <div className="order-info"><Truck size={20}/><div><b>{uiText("\u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 ")}<span dir="auto">{r.data.order.number}</span></b><p>{uiText("\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u0645\u062A\u0648\u0642\u0639: ")}{uiText(r.data.order.expected ? date(r.data.order.expected) : 'غير محدد')}</p></div>{uiText(admin && <button className="button light" onClick={onPrint}><Printer size={17}/>{uiText("\u0639\u0631\u0636 \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621")}</button>)}</div>)}
 {uiText(incoming && <form className="action-section receipt-section" onSubmit={e => { e.preventDefault(); if (!operation.current)
        operation.current = crypto.randomUUID(); void update({ action: 'receipt', quantities: receipt.map(x => x || '0'), note: receiptNote, operationId: operation.current }); }}><h3><PackageCheck size={19}/>{uiText("\u062A\u0633\u062C\u064A\u0644 \u0627\u0633\u062A\u0644\u0627\u0645 \u062C\u062F\u064A\u062F")}</h3><p className="muted">{uiText("\u0623\u062F\u062E\u0644 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0627\u0644\u062A\u064A \u0648\u0635\u0644\u062A \u0627\u0644\u0622\u0646 \u0641\u0642\u0637. \u064A\u064F\u063A\u0644\u0642 \u0627\u0644\u0637\u0644\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0639\u0646\u062F \u0627\u0633\u062A\u0644\u0627\u0645 \u0643\u0644 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.")}</p>{uiText(r.data.items.filter(i => (i.approved || 0) > 0).map(i => { const n = r.data.items.indexOf(i), remaining = Math.max(0, (i.approved || 0) - (i.received || 0)); return <div className="receipt-row" key={n}><div><b>{i.name}</b><small>{uiText("\u0627\u0644\u0645\u062A\u0628\u0642\u064A ")}{uiText(money(remaining))} {uiText(i.unit)}</small></div><Field label={uiText("المستلم الآن")}><input type="number" min={0} max={remaining} step="any" disabled={remaining === 0} value={receipt[n]} placeholder={uiText("0")} onChange={e => setReceipt(q => q.map((x, k) => k === n ? e.target.value : x))}/></Field></div>; }))}<Field label={uiText("ملاحظات الاستلام")}><textarea rows={2} maxLength={1000} value={receiptNote} onChange={e => setReceiptNote(e.target.value)} placeholder={uiText("النواقص أو الملاحظات على الأصناف")}/></Field><button className="button primary" disabled={busy}><PackageCheck size={17}/>{uiText("\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0629")}</button></form>)}
 {uiText(permitted('create') && r.site_id === user.id && r.state === 'needs_revision' && <button className="button primary" onClick={onEdit}>{uiText("\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644")}<ArrowLeft size={17}/></button>)}
 {uiText(!!r.data.receipts.length && <section className="receipts-log"><h3>{uiText("\u0633\u062C\u0644 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645")}</h3>{uiText(r.data.receipts.map(receipt => <div key={receipt.id}><b>{uiText(date(receipt.at))} · {receipt.by}</b><p>{uiText(receipt.quantities.map((q, i) => q ? `${r.data.items[i].name}: ${money(q)} ${r.data.items[i].unit}` : '').filter(Boolean).join('، '))}</p>{receipt.note && <small>{receipt.note}</small>}</div>))}</section>)}
 <InvoiceFiles request={r} user={user} onBusy={setBusy}/> <section className="history"><h3>{uiText("\u0645\u0633\u0627\u0631 \u0627\u0644\u0637\u0644\u0628")}</h3>{r.data.history.map((h, i) => <div key={i}><span /><section><b>{uiText(h.event)}</b><small>{h.by} · {uiText(date(h.at))}</small>{h.note && <p>{h.note}</p>}</section></div>)}</section>
 {uiText(permitted('review') && ['new', 'needs_revision', 'approved'].includes(r.state) && <div className="cancel-area">{uiText(cancel ? <><Field label={uiText("سبب إلغاء الطلب")}><input value={cancelNote} maxLength={1000} onChange={e => setCancelNote(e.target.value)}/></Field><button className="button danger-light" disabled={busy} onClick={() => update({ action: 'cancel', note: cancelNote })}>{uiText("\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0625\u0644\u063A\u0627\u0621")}</button></> : <button className="text-button" onClick={() => setCancel(true)}>{uiText("\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628")}</button>)}</div>)}
 <ErrorBox message={error}/>{uiText(busy && <p role="status" className="muted">{uiText("\u062C\u0627\u0631\u064D \u062D\u0641\u0638 \u0627\u0644\u0639\u0645\u0644\u064A\u0629\u2026")}</p>)}</div><div className="modal-actions"><button className="button light" disabled={busy} onClick={close}>{uiText("\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644")}</button></div></Modal>;
}
function SupplierForm({ supplier, close, onSaved }: {
    supplier: Supplier | null;
    close: () => void;
    onSaved: () => Promise<void>;
}) { const [name, setName] = useState(supplier?.name || ''), [phone, setPhone] = useState(supplier?.phone || ''), [email, setEmail] = useState(supplier?.email || ''), [notes, setNotes] = useState(supplier?.notes || ''), [active, setActive] = useState(supplier ? !!supplier.active : true), [busy, setBusy] = useState(false), [error, setError] = useState(''); return <Modal title={uiText(supplier ? 'تعديل المورد' : 'إضافة مورد')} close={busy ? () => { } : close}><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
    await api({ op: 'supplier', id: supplier?.id, name, phone, email, notes, active });
    await onSaved();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><div className="form-body"><Field label={uiText("اسم المورد")}><input required maxLength={160} value={name} onChange={e => setName(e.target.value)}/></Field><Field label={uiText("رقم التواصل")}><input type="tel" maxLength={80} value={phone} onChange={e => setPhone(e.target.value)}/></Field><Field label={uiText("البريد الإلكتروني")}><input type="email" maxLength={120} value={email} onChange={e => setEmail(e.target.value)}/></Field><Field label={uiText("الأصناف المتوفرة وملاحظات المورد")}><textarea rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)}/></Field><label className="checkbox"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}/>{uiText("\u0645\u0648\u0631\u062F \u0646\u0634\u0637 \u0645\u062A\u0627\u062D \u0644\u0644\u0627\u0639\u062A\u0645\u0627\u062F")}</label><ErrorBox message={error}/></div><div className="modal-actions"><button className="button primary" disabled={busy}>{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ المورد')}</button></div></form></Modal>; }
const permissionNames: Record<string, string> = { create: 'إنشاء الطلبات وتعديلها', receive: 'تسجيل الاستلام', review: 'مراجعة واعتماد الطلبات', dispatch: 'تجهيز أوامر الشراء', suppliers: 'إدارة الموردين', users: 'إدارة مستخدمي المواقع', allSites: 'مشاهدة جميع المواقع', prices: 'مشاهدة الأسعار' };
function UserForm({ user: u, self, close, onSaved }: {
    user: User;
    self: boolean;
    close: () => void;
    onSaved: () => Promise<void>;
}) { const [name, setName] = useState(u.name), [active, setActive] = useState(!!u.active), [flags, setFlags] = useState(u.permissions), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [current, setCurrent] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(''), [savedPassword, setSavedPassword] = useState(''); function generate() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const code = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => chars[b % 32]).join(''); setPassword(code); setConfirm(code); } function change(k: string, value: boolean) { setFlags(old => { const next = { ...old, [k]: value }; if (next.review || next.dispatch)
    next.prices = true; return next; }); } return <Modal title={uiText('إدارة ' + u.name)} close={busy ? () => { } : close}><form onSubmit={async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (password !== confirm) {
    setError('تأكيد كلمة المرور غير مطابق');
    return;
} setBusy(true); try {
    await api({ op: 'user', id: u.id, name, active, permissions: u.role === 'admin' ? undefined : flags, newPassword: password, currentPassword: current });
    setSavedPassword(password);
    setSuccess(password ? 'تم تغيير كلمة المرور. استخدم اسم المستخدم مع كلمة المرور الجديدة.' : 'تم حفظ الصلاحيات');
    setPassword('');
    setConfirm('');
    setCurrent('');
    await onSaved();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><div className="form-body"><Field label={uiText("اسم المستخدم للدخول")}><input className="mono" dir="ltr" readOnly value={u.id}/></Field><Field label={uiText(u.role === 'admin' ? 'اسم المدير' : 'اسم الموقع / المستخدم')}><input required maxLength={160} value={name} onChange={e => setName(e.target.value)}/></Field>{uiText(u.role !== 'admin' && <label className="checkbox"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}/>{uiText("\u0627\u0644\u0633\u0645\u0627\u062D \u0628\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644")}</label>)}<hr /><h3>{uiText("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631")}</h3><p className="inline-note">{uiText("\u0627\u062A\u0631\u0643\u0647\u0627 \u0641\u0627\u0631\u063A\u0629 \u0644\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u062D\u0627\u0644\u064A\u0629. \u064A\u0645\u0643\u0646\u0643 \u0643\u062A\u0627\u0628\u0629 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062C\u062F\u064A\u062F\u0629 \u0623\u0648 \u062A\u0648\u0644\u064A\u062F \u0648\u0627\u062D\u062F\u0629.")}</p>{uiText(self && <Field label={uiText("كلمة المرور أو الكود الحالي")} hint={uiText("مطلوب عند تغيير كلمة مرور حسابك")}><input type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} maxLength={120}/></Field>)}<button className="button light" type="button" disabled={busy} onClick={generate}><RefreshCw size={16}/>{uiText("\u062A\u0648\u0644\u064A\u062F \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631")}</button><Field label={uiText("كلمة المرور الجديدة")} hint={uiText("10 أحرف أو أرقام على الأقل؛ احفظها قبل تأكيد التغيير.")}><input type="text" dir="ltr" autoComplete="off" minLength={10} maxLength={120} value={password} onChange={e => setPassword(e.target.value)}/></Field><Field label={uiText("تأكيد كلمة المرور")}><input type="password" dir="ltr" autoComplete="new-password" minLength={10} maxLength={120} value={confirm} onChange={e => setConfirm(e.target.value)}/></Field><hr /><h3>{uiText("\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A")}</h3>{uiText(u.role === 'admin' ? <p className="inline-note">{uiText("\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u064A\u062D\u062A\u0641\u0638 \u0628\u062C\u0645\u064A\u0639 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629.")}</p> : <div className="permissions-grid">{uiText(Object.entries(permissionNames).map(([k, label]) => <label key={k} className="checkbox"><input type="checkbox" checked={flags[k] === true} disabled={k === 'prices' && (flags.review || flags.dispatch)} onChange={e => change(k, e.target.checked)}/>{uiText(label)}</label>))}</div>)}<ErrorBox message={error}/>{uiText(success && <div className="notice" role="status"><Check size={18}/><p>{uiText(success)}</p></div>)}{uiText(savedPassword && <div className="new-code"><b>{uiText("\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628")}</b><code dir="ltr">{uiText(savedPassword)}</code><button type="button" className="button light" onClick={() => download(`اسم المستخدم: ${u.id}\nكلمة المرور: ${savedPassword}\nالرابط: ${location.origin}\n`, 'دخول_' + u.id + '.txt', 'text/plain;charset=utf-8')}><Download size={16}/>{uiText("\u062A\u0646\u0632\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644")}</button></div>)}</div><div className="modal-actions"><button className="button primary" disabled={busy}>{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ المستخدم والصلاحيات')}</button></div></form></Modal>; }
function OrderPreview({ request: r, close }: {
    request: Purchase;
    close: () => void;
}) { return <Modal title={uiText("أمر الشراء")} close={close} wide><div className="purchase-order" id="purchase-order"><div className="order-title"><Logo /><div><h2>{uiText("\u0623\u0645\u0631 \u0634\u0631\u0627\u0621")}</h2><b dir="auto">{r.data.order?.number}</b></div></div><div className="detail-info"><div><small>{uiText("\u0627\u0644\u0645\u0648\u0631\u062F")}</small><strong>{r.data.supplier?.name}</strong></div><div><small>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</small><strong>{r.data.siteName}</strong></div><div><small>{uiText("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0623\u0645\u0631")}</small><strong>{uiText(date(r.data.order?.at || r.updated))}</strong></div><div><small>{uiText("\u0645\u0631\u062C\u0639 \u0627\u0644\u0637\u0644\u0628")}</small><strong className="mono">{uiText(ref(r))}</strong></div><div><small>{uiText("\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u0645\u062A\u0648\u0642\u0639")}</small><strong>{uiText(r.data.order?.expected ? date(r.data.order.expected) : 'غير محدد')}</strong></div><div><small>{uiText("\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0648\u0631\u062F")}</small><strong dir="auto">{uiText(r.data.supplier?.phone || r.data.supplier?.email || '—')}</strong></div></div><div className="order-table-wrap"><table><thead><tr><th>{uiText("\u0627\u0644\u0635\u0646\u0641 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A")}</th><th>{uiText("\u0627\u0644\u0643\u0645\u064A\u0629")}</th><th>{uiText("\u0627\u0644\u0648\u062D\u062F\u0629")}</th><th>{uiText("\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A")}</th></tr></thead><tbody>{r.data.items.filter(i => (i.approved || 0) > 0).map((i, n) => <tr key={n}><td><b>{i.name}</b><small>{i.spec}</small></td><td>{uiText(money(i.approved || 0))}</td><td>{uiText(i.unit)}</td><td>{uiText(money(i.price || 0))}</td><td>{uiText(money((i.approved || 0) * (i.price || 0)))}</td></tr>)}</tbody></table></div><p className="total-line">{uiText("\u0625\u062C\u0645\u0627\u0644\u064A \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 ")}<strong>{uiText(money(r.data.items.reduce((n, i) => n + (i.approved || 0) * (i.price || 0), 0)))}</strong></p>{uiText(r.data.reviewNote && <p>{uiText("\u0645\u0644\u0627\u062D\u0638\u0627\u062A: ")}{uiText(r.data.reviewNote)}</p>)}<small className="muted">{uiText("\u0627\u0644\u0642\u064A\u0645 \u0628\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627\u060C \u062F\u0648\u0646 \u062D\u0633\u0627\u0628 \u0636\u0631\u0627\u0626\u0628 \u0623\u0648 \u0631\u0633\u0648\u0645 \u0625\u0636\u0627\u0641\u064A\u0629.")}</small></div><div className="modal-actions"><button className="button primary" onClick={() => window.print()}><Printer size={17}/>{uiText("\u0637\u0628\u0627\u0639\u0629 / \u062D\u0641\u0638 PDF")}</button><span className="muted">{uiText("\u0623\u0631\u0633\u0644 \u0627\u0644\u0646\u0633\u062E\u0629 \u0644\u0644\u0645\u0648\u0631\u062F \u0645\u0646 \u0647\u0627\u062A\u0641\u0643 \u0628\u0639\u062F \u0627\u0644\u062D\u0641\u0638.")}</span></div></Modal>; }
