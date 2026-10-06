'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BarChart3, Boxes, Check, ClipboardList, CreditCard, Download, FileText, ImagePlus, LayoutDashboard, MapPin, Plus, Printer, Truck, X } from 'lucide-react';
import { uiText, getLanguage, translateString } from '@/lib/i18n.mjs';
import { readApiResponse, platformSignInMessage } from '@/lib/api-response.mjs';
import type { Purchase, User, Site } from '@/app/page';
type Invoice = {
    id: string;
    request_id: string;
    supplier_id: string;
    number: string;
    date: string;
    due: string;
    total_cents: number;
    paid_cents: number;
    remaining_cents: number;
    notes: string;
    site_id: string;
    siteName: string;
    supplierName: string;
    seq: number;
    file_count: number;
};
type Payment = {
    id: string;
    invoice_id: string;
    amount_cents: number;
    date: string;
    method: string;
    reference: string;
    by: string;
};
type Stock = {
    key: string;
    siteId: string;
    name: string;
    spec: string;
    unit: string;
    received: number;
    added: number;
    issued: number;
    balance: number;
};
type Move = {
    id: string;
    site_id: string;
    name: string;
    spec: string;
    unit: string;
    qty: number;
    kind: string;
    date: string;
    note: string;
    by: string;
};
type LegacyFile = {
    id: string;
    request_id: string;
    filename: string;
    site_id: string;
    siteName: string;
    seq: number;
};
type Data = {
    invoices: Invoice[];
    payments: Payment[];
    stock: Stock[];
    moves: Move[];
    approved: Purchase[];
    legacyFiles: LegacyFile[];
};
const empty: Data = { invoices: [], payments: [], stock: [], moves: [], approved: [], legacyFiles: [] };
const amount = (n: number) => new Intl.NumberFormat(getLanguage() === 'en' ? 'en-GB' : 'ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100);
const qty = (n: number) => new Intl.NumberFormat(getLanguage() === 'en' ? 'en-GB' : 'ar-SA', { maximumFractionDigits: 6 }).format(n);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
const ref = (r: {
    seq: number;
}) => 'PR-' + String(r.seq).padStart(6, '0');
const status = (i: Invoice) => translateString(i.remaining_cents === 0 ? 'مدفوعة' : i.paid_cents > 0 ? 'مدفوعة جزئيًا' : 'غير مدفوعة');
function ErrorBox({ text }: {
    text: string;
}) { return text ? <div className="error" role="alert"><p>{uiText(text)}</p>{uiText(text === platformSignInMessage && <a className="button primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">{uiText("\u062A\u062C\u062F\u064A\u062F \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0639")}</a>)}</div> : null; }
function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label className="field"><span>{uiText(label)}</span>{uiText(children)}</label>; }
function Pop({ title, children, close, locked = false, report = false }: {
    title: string;
    children: React.ReactNode;
    close: () => void;
    locked?: boolean;
    report?: boolean;
}) { const box = useRef<HTMLDivElement>(null); useEffect(() => { const previous = document.activeElement as HTMLElement; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; box.current?.focus(); return () => { document.body.style.overflow = old; previous?.focus(); }; }, []); return <div className="overlay"><div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={uiText(title)} className={'modal wide' + (report ? ' report-modal' : '')} onKeyDown={e => { if (e.key === 'Escape' && !locked)
    close(); if (e.key === 'Tab') {
    const list = box.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]');
    if (!list?.length)
        return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
        e.preventDefault();
        last.focus();
    }
    else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
} }}><header><h2>{uiText(title)}</h2><button disabled={locked} className="icon-button" aria-label={uiText("إغلاق")} onClick={close}><X size={20}/></button></header>{uiText(children)}</div></div>; }
async function business(body?: Record<string, unknown>, view = ''): Promise<Data> { const r = await fetch('/api/business' + (view ? '?view=' + encodeURIComponent(view) : ''), { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }); return await readApiResponse(r) as Data; }
function exportRows(rows: unknown[][], name: string) { const cell = (v: unknown) => { let text = String(v ?? ''); if (typeof v === 'string' && /^[\s]*[=+@-]/.test(text))
    text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; }; const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((row, index) => row.map(v => cell(index === 0 ? translateString(v) : v)).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function FinancialCards({ invoices }: {
    invoices: Invoice[];
}) { const total = invoices.reduce((n, i) => n + i.total_cents, 0), paid = invoices.reduce((n, i) => n + i.paid_cents, 0); return <div className="finance-cards"><article><small>{uiText("\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631")}</small><strong>{uiText(amount(total))} <em>{uiText("\u0631.\u0633")}</em></strong><span>{uiText(invoices.length)}{uiText(" \u0641\u0627\u062A\u0648\u0631\u0629")}</span></article><article><small>{uiText("\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062F\u0641\u0648\u0639")}</small><strong>{uiText(amount(paid))} <em>{uiText("\u0631.\u0633")}</em></strong><span>{uiText("\u0627\u0644\u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631")}</span></article><article><small>{uiText("\u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0644\u0644\u062F\u0641\u0639")}</small><strong>{uiText(amount(total - paid))} <em>{uiText("\u0631.\u0633")}</em></strong><span>{uiText(invoices.filter(i => i.remaining_cents > 0).length)}{uiText(" \u0641\u0627\u062A\u0648\u0631\u0629 \u0628\u0647\u0627 \u0631\u0635\u064A\u062F")}</span></article></div>; }
function InvoiceTable({ invoices, open, pay, canPay = false }: {
    invoices: Invoice[];
    open: (i: Invoice) => void;
    pay?: (i: Invoice) => void;
    canPay?: boolean;
}) { return <div className="business-table"><table><thead><tr><th>{uiText("\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 / \u0627\u0644\u062A\u0627\u0631\u064A\u062E")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639 / \u0627\u0644\u0645\u0648\u0631\u062F")}</th><th>{uiText("\u0627\u0644\u0637\u0644\u0628")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A")}</th><th>{uiText("\u0627\u0644\u0645\u062F\u0641\u0648\u0639")}</th><th>{uiText("\u0627\u0644\u0645\u062A\u0628\u0642\u064A")}</th><th>{uiText("\u0627\u0644\u062D\u0627\u0644\u0629")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0631\u0627\u0621")}</th></tr></thead><tbody>{uiText(invoices.map(i => <tr key={i.id}><td><b>{i.number}</b><small>{uiText(i.date)}</small>{uiText(i.due && <small>{uiText("\u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642 ")}{uiText(i.due)}</small>)}</td><td><b>{i.siteName}</b><small>{uiText(i.supplierName)}</small></td><td><span dir="ltr">{uiText(ref(i))}</span></td><td>{uiText(amount(i.total_cents))}</td><td>{uiText(amount(i.paid_cents))}</td><td>{uiText(amount(i.remaining_cents))}</td><td><span className={'badge ' + (i.remaining_cents === 0 ? 'b-received' : i.paid_cents ? 'b-partial' : 'b-new')}>{uiText(status(i))}</span></td><td><div className="table-actions"><button className="button light" onClick={() => open(i)}><ImagePlus size={15}/>{uiText("\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0627\u0644\u0635\u0648\u0631\u0629")}</button>{uiText(canPay && i.remaining_cents > 0 && pay && <button className="button primary" onClick={() => pay(i)}><CreditCard size={15}/>{uiText("\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629")}</button>)}</div></td></tr>))}</tbody></table>{uiText(!invoices.length && <p className="business-empty">{uiText("\u0644\u0627 \u062A\u0648\u062C\u062F \u0641\u0648\u0627\u062A\u064A\u0631 \u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631. \u0633\u062C\u0651\u0644 \u0623\u0648\u0644 \u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0646 \u0635\u0641\u062D\u0629 \u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646.")}</p>)}</div>; }
export function BusinessWorkspace({ tab, user, sites, stats, trigger, onRequest, onNavigate, renderFiles }: {
    tab: string;
    user: User;
    sites: Site[];
    stats: {
        state: string;
        count: number;
    }[];
    trigger: unknown;
    onRequest: (r: Purchase) => void;
    onNavigate: (tab: string) => void;
    renderFiles: (r: Purchase, id: string, onBusy: (busy: boolean) => void) => React.ReactNode;
}) {
    const [data, setData] = useState<Data>(empty), [loading, setLoading] = useState(true), [error, setError] = useState(''), [success, setSuccess] = useState(''), [site, setSite] = useState(''), [supplier, setSupplier] = useState(''), [paymentState, setPaymentState] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [search, setSearch] = useState(''), [invoiceForm, setInvoiceForm] = useState(false), [invoice, setInvoice] = useState<Invoice | null>(null), [payment, setPayment] = useState<Invoice | null>(null), [stockForm, setStockForm] = useState<Stock | 'new' | null>(null), [report, setReport] = useState(false), [imageBusy, setImageBusy] = useState(false);
    const canWrite = user.role === 'admin';
    async function refresh() { setError(''); try {
        setData(await business(undefined, tab === 'inventory' ? 'inventory' : ''));
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { let active = true; business(undefined, tab === 'inventory' ? 'inventory' : '').then(d => { if (active) {
        setData(d);
        setError('');
    } }).catch(e => { if (active)
        setError(e.message); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [trigger]);
    const filtered = data.invoices.filter(i => (!site || i.site_id === site) && (!supplier || i.supplier_id === supplier) && (!from || i.date >= from) && (!to || i.date <= to) && (!paymentState || (paymentState === 'paid' ? i.remaining_cents === 0 : paymentState === 'partial' ? i.paid_cents > 0 && i.remaining_cents > 0 : i.paid_cents === 0)) && [i.number, i.supplierName, i.siteName, ref(i)].join(' ').toLowerCase().includes(search.toLowerCase()));
    const suppliers = [...new Map(data.invoices.map(i => [i.supplier_id, i.supplierName])).entries()];
    const stock = data.stock.filter(i => (!site || i.siteId === site) && [i.name, i.spec].join(' ').includes(search));
    const orders = data.approved.filter(r => (!site || r.site_id === site) && [ref(r), r.data.order?.number, r.data.supplier?.name, ...r.data.items.map(i => i.name)].join(' ').toLowerCase().includes(search.toLowerCase()));
    const siteName = (id: string) => sites.find(s => s.id === id)?.name || id;
    const count = (...states: string[]) => stats.filter(s => states.includes(s.state)).reduce((n, s) => n + s.count, 0);
    async function saved(message: string) { await refresh(); setSuccess(message); }
    function invoiceExport() { exportRows([['رقم الفاتورة', 'التاريخ', 'الموقع', 'المورد', 'الطلب', 'الإجمالي ر.س', 'المدفوع ر.س', 'المتبقي ر.س', 'حالة الدفع', 'الاستحقاق'], ...filtered.map(i => [i.number, i.date, i.siteName, i.supplierName, ref(i), i.total_cents / 100, i.paid_cents / 100, i.remaining_cents / 100, status(i), i.due])], 'فواتير_' + (site ? siteName(site) : 'جميع_المواقع')); }
    const filters = <div className="business-filters"><Field label={uiText("الموقع")}><select value={site} onChange={e => setSite(e.target.value)}><option value="">{uiText("\u0643\u0644 \u0627\u0644\u0645\u0648\u0627\u0642\u0639")}</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label={uiText("بحث")}><input value={search} onChange={e => setSearch(e.target.value)} placeholder={uiText(tab === 'inventory' ? 'الصنف أو المواصفات' : 'الرقم أو المورد أو الصنف')}/></Field>{uiText(['invoices', 'accounts', 'reports'].includes(tab) && <><Field label={uiText("المورد")}><select value={supplier} onChange={e => setSupplier(e.target.value)}><option value="">{uiText("\u0643\u0644 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646")}</option>{uiText(suppliers.map(([id, name]) => <option key={id} value={id}>{uiText(name)}</option>))}</select></Field><Field label={uiText("حالة الدفع")}><select value={paymentState} onChange={e => setPaymentState(e.target.value)}><option value="">{uiText("\u0643\u0644 \u0627\u0644\u062D\u0627\u0644\u0627\u062A")}</option><option value="unpaid">{uiText("\u063A\u064A\u0631 \u0645\u062F\u0641\u0648\u0639\u0629")}</option><option value="partial">{uiText("\u0645\u062F\u0641\u0648\u0639\u0629 \u062C\u0632\u0626\u064A\u064B\u0627")}</option><option value="paid">{uiText("\u0645\u062F\u0641\u0648\u0639\u0629")}</option></select></Field><Field label={uiText("من تاريخ الفاتورة")}><input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></Field><Field label={uiText("إلى تاريخ الفاتورة")}><input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></Field></>)}</div>;
    return <><ErrorBox text={error}/>{uiText(success && <div className="notice" role="status"><Check size={18}/>{uiText(success)}<button className="icon-button" aria-label={uiText("إغلاق التنبيه")} onClick={() => setSuccess('')}><X size={16}/></button></div>)}{uiText(loading ? <p className="inline-note">{uiText("\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629\u2026")}</p> : <>
 {uiText(tab === 'dashboard' && <><div className="dashboard-welcome"><div><span>{uiText("\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0627\u0642\u0639")}</span><h2>{uiText("\u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A")}</h2><p>{uiText("\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0642\u0639\u060C \u0627\u0644\u062A\u0648\u0631\u064A\u062F\u060C \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.")}</p></div><LayoutDashboard size={38}/></div><div className="dashboard-counts">{uiText([['طلبات بانتظار المراجعة', count('new', 'needs_revision'), 'requests'], ['أوامر معتمدة قيد التنفيذ', count('approved', 'ordered', 'partial'), 'orders'], ['طلبات مكتملة الاستلام', count('received'), 'orders'], ['فواتير غير مسددة بالكامل', data.invoices.filter(i => i.remaining_cents > 0).length, 'accounts']].map(([name, n, target]) => <button key={name} onClick={() => onNavigate(String(target))}><span>{uiText(name)}</span><strong>{uiText(n)}</strong><small>{uiText("\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u2190")}</small></button>))}</div><FinancialCards invoices={data.invoices}/><div className="dashboard-columns"><section className="panel"><div className="panel-heading"><div><h2>{uiText("\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u062D\u0633\u0628 \u0627\u0644\u0645\u0648\u0642\u0639")}</h2><p>{uiText("\u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0633\u062C\u0644\u0629 \u0648\u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0644\u0643\u0644 \u0645\u0648\u0642\u0639.")}</p></div><BarChart3 size={22}/></div><div className="site-finance-list">{uiText(sites.map(s => { const rows = data.invoices.filter(i => i.site_id === s.id), total = rows.reduce((n, i) => n + i.total_cents, 0), remaining = rows.reduce((n, i) => n + i.remaining_cents, 0), max = Math.max(1, ...sites.map(site => data.invoices.filter(i => i.site_id === site.id).reduce((n, i) => n + i.total_cents, 0))); return <div key={s.id}><b>{s.name}</b><span>{uiText(amount(total))}{uiText(" \u0631.\u0633 ")}<small>{uiText("\u0627\u0644\u0645\u062A\u0628\u0642\u064A ")}{uiText(amount(remaining))}</small></span><div className="site-bar"><i style={{ width: (total / max * 100) + '%' }}/></div></div>; }))}</div></section><section className="panel"><div className="panel-heading"><div><h2>{uiText("\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0633\u0631\u064A\u0639")}</h2><p>{uiText("\u0627\u0628\u062F\u0623 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0645\u0646 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.")}</p></div></div><div className="quick-links"><button onClick={() => onNavigate('requests')}><ClipboardList />{uiText("\u0645\u0631\u0627\u062C\u0639\u0629 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0642\u0639")}</button><button onClick={() => onNavigate('invoices')}><FileText />{uiText("\u062A\u0633\u062C\u064A\u0644 \u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0631\u0641\u0639 \u0635\u0648\u0631\u062A\u0647\u0627")}</button><button onClick={() => onNavigate('inventory')}><Boxes />{uiText("\u0639\u0631\u0636 \u0623\u0631\u0635\u062F\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646")}</button><button onClick={() => onNavigate('reports')}><BarChart3 />{uiText("\u062A\u0642\u0631\u064A\u0631 \u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u0648\u0642\u0639")}</button></div></section></div></>)}
 {uiText(tab === 'orders' && <section className="panel"><div className="panel-heading"><div><h2>{uiText("\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629")}</h2><p>{uiText("\u0643\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629\u060C \u0645\u0639 \u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0648\u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645.")}</p></div><Truck size={24}/></div>{uiText(filters)}<div className="business-table"><table><thead><tr><th>{uiText("\u0627\u0644\u0637\u0644\u0628 / \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0631\u062F")}</th><th>{uiText("\u0627\u0644\u0623\u0635\u0646\u0627\u0641")}</th><th>{uiText("\u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0631.\u0633")}</th><th>{uiText("\u062D\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0631\u064A\u062F")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0631\u0627\u0621")}</th></tr></thead><tbody>{uiText(orders.map(r => <tr key={r.id}><td><b dir="ltr">{uiText(ref(r))}</b><small>{uiText(r.data.order?.number || 'لم يصدر أمر التوريد بعد')}</small></td><td>{r.data.siteName}</td><td>{r.data.supplier?.name || '—'}</td><td>{uiText(r.data.items.length)}</td><td>{uiText(amount(Math.round(r.data.items.reduce((n, i) => n + (i.approved || 0) * (i.price || 0), 0) * 100)))}</td><td><span className={'badge b-' + r.state}>{uiText(({ approved: 'معتمد', ordered: 'قيد التوريد', partial: 'استلام جزئي', received: 'تم الاستلام' } as Record<string, string>)[r.state])}</span></td><td><button className="button light" onClick={() => onRequest(r)}>{uiText("\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 / \u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621")}</button></td></tr>))}</tbody></table>{uiText(!orders.length && <p className="business-empty">{uiText("\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0648\u0627\u0645\u0631 \u0634\u0631\u0627\u0621 \u0645\u0639\u062A\u0645\u062F\u0629 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646.")}</p>)}</div></section>)}
 {uiText(['invoices', 'accounts', 'reports'].includes(tab) && <><FinancialCards invoices={filtered}/><section className="panel"><div className="panel-heading"><div><h2>{uiText(tab === 'accounts' ? 'الحسابات والمدفوعات' : tab === 'reports' ? 'تقارير فواتير المواقع' : 'فواتير الموردين')}</h2><p>{uiText(tab === 'accounts' ? 'سجّل دفعة كاملة أو جزئية وتابع المتبقي على كل فاتورة.' : tab === 'reports' ? 'اختر موقعًا والفترة لعرض فواتيره وصورها، ثم صدّر التقرير أو اطبعه.' : 'سجّل فاتورة المورد على طلب بدأ توريده، ثم ارفع صورة الفاتورة.')}</p></div><div className="table-actions">{uiText(tab === 'invoices' && canWrite && <button className="button primary" onClick={() => setInvoiceForm(true)}><Plus size={17}/>{uiText("\u062A\u0633\u062C\u064A\u0644 \u0641\u0627\u062A\u0648\u0631\u0629")}</button>)}<button className="button light" onClick={invoiceExport}><Download size={17}/>{uiText("\u062A\u0635\u062F\u064A\u0631 Excel CSV")}</button>{uiText(tab === 'reports' && <button className="button primary" onClick={() => setReport(true)}><Printer size={17}/>{uiText("\u0637\u0628\u0627\u0639\u0629 / PDF")}</button>)}</div></div>{uiText(filters)}<InvoiceTable invoices={filtered} open={setInvoice} pay={setPayment} canPay={tab === 'accounts' && canWrite}/></section>{uiText(tab === 'accounts' && <section className="panel payments-panel"><div className="panel-heading"><div><h2>{uiText("\u0633\u062C\u0644 \u0627\u0644\u062F\u0641\u0639\u0627\u062A")}</h2><p>{uiText("\u0627\u0644\u062F\u0641\u0639\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0638\u0627\u0647\u0631\u0629 \u062D\u0633\u0628 \u0627\u0644\u062A\u0635\u0641\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.")}</p></div></div><PaymentTable payments={data.payments.filter(p => filtered.some(i => i.id === p.invoice_id))} invoices={data.invoices}/></section>)}{uiText((tab === 'invoices' || tab === 'reports') && data.legacyFiles.length > 0 && <section className="panel payments-panel"><div className="panel-heading"><div><h2>{uiText("\u0635\u0648\u0631 \u0641\u0648\u0627\u062A\u064A\u0631 \u0633\u0627\u0628\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062A")}</h2><p>{uiText("\u0635\u0648\u0631 \u0645\u062D\u0641\u0648\u0638\u0629 \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A\u060C \u0644\u0645 \u062A\u064F\u0631\u0628\u0637 \u0628\u0633\u062C\u0644 \u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0627\u0644\u064A \u0628\u0639\u062F. \u0627\u0641\u062A\u062D \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u064A\u0647\u0627.")}</p></div></div><div className="legacy-files">{data.legacyFiles.filter(f => (!site || f.site_id === site)).map(f => <a key={f.id} href={'/api/invoice-files?id=' + f.id} target="_blank" rel="noreferrer"><ImagePlus size={18}/><b>{f.filename}</b><span>{f.siteName} · {uiText(ref(f))}</span></a>)}</div></section>)}</>)}
 {uiText(tab === 'inventory' && <section className="panel"><div className="panel-heading"><div><h2>{uiText("\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u062D\u0633\u0628 \u0627\u0644\u0645\u0648\u0642\u0639")}</h2><p>{uiText("\u0627\u0644\u0631\u0635\u064A\u062F = \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0629 \u0645\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A + \u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062A \u2212 \u0627\u0644\u0635\u0631\u0641. \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u062A\u0637\u0627\u0628\u0642\u0629 \u0628\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0648\u0627\u0644\u0648\u062D\u062F\u0629 \u062A\u064F\u062C\u0645\u0639 \u0645\u0639\u064B\u0627.")}</p></div>{uiText(canWrite && <button className="button primary" onClick={() => setStockForm('new')}><Plus size={17}/>{uiText("\u0625\u0636\u0627\u0641\u0629 \u0631\u0635\u064A\u062F")}</button>)}</div>{uiText(filters)}<div className="business-table"><table><thead><tr><th>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</th><th>{uiText("\u0627\u0644\u0635\u0646\u0641 / \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A")}</th><th>{uiText("\u0627\u0644\u0648\u062D\u062F\u0629")}</th><th>{uiText("\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A")}</th><th>{uiText("\u0625\u0636\u0627\u0641\u0627\u062A")}</th><th>{uiText("\u0645\u0635\u0631\u0648\u0641")}</th><th>{uiText("\u0627\u0644\u0631\u0635\u064A\u062F")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0631\u0627\u0621")}</th></tr></thead><tbody>{uiText(stock.map(i => <tr key={i.key}><td>{uiText(siteName(i.siteId))}</td><td><b>{i.name}</b><small>{i.spec || '—'}</small></td><td>{uiText(i.unit)}</td><td>{uiText(qty(i.received))}</td><td>{uiText(qty(i.added))}</td><td>{uiText(qty(i.issued))}</td><td><b>{uiText(qty(i.balance))}</b></td><td>{uiText(canWrite && <button className="button light" onClick={() => setStockForm(i)}>{uiText("\u0625\u0636\u0627\u0641\u0629 / \u0635\u0631\u0641")}</button>)}</td></tr>))}</tbody></table>{uiText(!stock.length && <p className="business-empty">{uiText("\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0631\u0635\u062F\u0629 \u0628\u0639\u062F. \u062A\u0638\u0647\u0631 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0639\u0646\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A\u060C \u0623\u0648 \u064A\u0645\u0643\u0646\u0643 \u0625\u0636\u0627\u0641\u0629 \u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D\u064A.")}</p>)}</div><div className="panel-heading"><h2>{uiText("\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0633\u062C\u0644\u0629")}</h2><button className="button light" onClick={() => exportRows([['الموقع', 'الصنف', 'المواصفات', 'الوحدة', 'استلام الطلبات', 'الإضافات', 'المصروف', 'الرصيد'], ...stock.map(i => [siteName(i.siteId), i.name, i.spec, i.unit, i.received, i.added, i.issued, i.balance])], 'المخزون')}>{uiText("\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646")}</button></div><div className="business-table"><table><thead><tr><th>{uiText("\u0627\u0644\u062A\u0627\u0631\u064A\u062E")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</th><th>{uiText("\u0627\u0644\u0635\u0646\u0641")}</th><th>{uiText("\u0627\u0644\u062D\u0631\u0643\u0629")}</th><th>{uiText("\u0627\u0644\u0643\u0645\u064A\u0629")}</th><th>{uiText("\u0627\u0644\u0633\u0628\u0628")}</th><th>{uiText("\u0633\u062C\u0651\u0644\u0647\u0627")}</th></tr></thead><tbody>{uiText(data.moves.filter(m => (!site || m.site_id === site) && [m.name, m.spec].join(' ').includes(search)).map(m => <tr key={m.id}><td>{uiText(m.date)}</td><td>{uiText(siteName(m.site_id))}</td><td>{m.name}</td><td>{uiText(m.kind === 'in' ? 'إضافة' : 'صرف')}</td><td>{uiText(qty(m.qty))} {uiText(m.unit)}</td><td>{m.note}</td><td>{m.by}</td></tr>))}</tbody></table></div></section>)}
 </>)}
 {uiText(invoiceForm && <InvoiceForm requests={data.approved.filter(r => ['ordered', 'partial', 'received'].includes(r.state))} close={() => setInvoiceForm(false)} onSaved={async (id) => { setInvoiceForm(false); const fresh = await business(); setData(fresh); setInvoice(fresh.invoices.find(i => i.id === id) || null); setSuccess('تم تسجيل الفاتورة. ارفع صورتها من نافذة الفاتورة.'); }}/>)}
 {uiText(invoice && <Pop title={uiText('فاتورة ' + invoice.number)} locked={imageBusy} close={() => { setInvoice(null); void refresh(); }}><div className="form-body"><div className="detail-info"><div><small>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</small><strong>{invoice.siteName}</strong></div><div><small>{uiText("\u0627\u0644\u0645\u0648\u0631\u062F")}</small><strong>{uiText(invoice.supplierName)}</strong></div><div><small>{uiText("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629")}</small><strong>{uiText(invoice.date)}</strong></div><div><small>{uiText("\u0627\u0644\u0637\u0644\u0628")}</small><strong>{uiText(ref(invoice))}</strong></div></div><FinancialCards invoices={[data.invoices.find(i => i.id === invoice.id) || invoice]}/>{invoice.notes && <p>{invoice.notes}</p>}{uiText(data.approved.find(r => r.id === invoice.request_id) && renderFiles(data.approved.find(r => r.id === invoice.request_id)!, invoice.id, setImageBusy))}<h3>{uiText("\u062F\u0641\u0639\u0627\u062A \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629")}</h3><PaymentTable payments={data.payments.filter(p => p.invoice_id === invoice.id)} invoices={data.invoices}/></div></Pop>)}
 {uiText(payment && <PaymentForm invoice={data.invoices.find(i => i.id === payment.id) || payment} close={() => setPayment(null)} onSaved={async () => { setPayment(null); await saved('تم تسجيل الدفعة وتحديث المبلغ المتبقي.'); }}/>)}
 {uiText(stockForm && <StockForm stock={stockForm === 'new' ? null : stockForm} sites={sites} close={() => setStockForm(null)} onSaved={async () => { setStockForm(null); await saved('تم تسجيل حركة المخزون.'); }}/>)}
 {uiText(report && <Pop title={uiText("تقرير فواتير المواقع")} report close={() => setReport(false)}><div className="report-print"><h1>{uiText("\u062A\u0642\u0631\u064A\u0631 \u0641\u0648\u0627\u062A\u064A\u0631 ")}{uiText(site ? siteName(site) : 'جميع المواقع')}</h1><p>{uiText("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0642\u0631\u064A\u0631 ")}{uiText(today())}{uiText(" \u00B7 \u0627\u0644\u0641\u062A\u0631\u0629 ")}{uiText(from || 'البداية')} — {uiText(to || 'حتى اليوم')}{uiText(supplier ? ' · المورد ' + suppliers.find(s => s[0] === supplier)?.[1] : '')}{uiText(paymentState ? ' · حالة الدفع ' + ({ paid: 'مدفوعة', partial: 'مدفوعة جزئيًا', unpaid: 'غير مدفوعة' } as Record<string, string>)[paymentState] : '')}{uiText(search ? ' · البحث ' + search : '')}</p><FinancialCards invoices={filtered}/><table><thead><tr><th>{uiText("\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629")}</th><th>{uiText("\u0627\u0644\u062A\u0627\u0631\u064A\u062E")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0642\u0639")}</th><th>{uiText("\u0627\u0644\u0645\u0648\u0631\u062F")}</th><th>{uiText("\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0631.\u0633")}</th><th>{uiText("\u0627\u0644\u0645\u062F\u0641\u0648\u0639")}</th><th>{uiText("\u0627\u0644\u0645\u062A\u0628\u0642\u064A")}</th></tr></thead><tbody>{filtered.map(i => <tr key={i.id}><td>{i.number}</td><td>{uiText(i.date)}</td><td>{i.siteName}</td><td>{uiText(i.supplierName)}</td><td>{uiText(amount(i.total_cents))}</td><td>{uiText(amount(i.paid_cents))}</td><td>{uiText(amount(i.remaining_cents))}</td></tr>)}</tbody></table><p>{uiText("\u0639\u062F\u062F \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631: ")}{uiText(filtered.length)}{uiText(". \u0635\u0648\u0631 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0639\u0628\u0631 \u0641\u062A\u062D \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631.")}</p></div><div className="modal-actions"><button className="button primary" onClick={() => window.print()}><Printer size={17}/>{uiText("\u0637\u0628\u0627\u0639\u0629 / \u062D\u0641\u0638 PDF")}</button></div></Pop>)}
 </>;
}
function PaymentTable({ payments, invoices }: {
    payments: Payment[];
    invoices: Invoice[];
}) { return <div className="business-table"><table><thead><tr><th>{uiText("\u0627\u0644\u062A\u0627\u0631\u064A\u062E")}</th><th>{uiText("\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629")}</th><th>{uiText("\u0627\u0644\u0645\u0628\u0644\u063A \u0631.\u0633")}</th><th>{uiText("\u0627\u0644\u0637\u0631\u064A\u0642\u0629")}</th><th>{uiText("\u0627\u0644\u0645\u0631\u062C\u0639")}</th><th>{uiText("\u0633\u062C\u0644\u0647\u0627")}</th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{uiText(p.date)}</td><td>{invoices.find(i => i.id === p.invoice_id)?.number || '—'}</td><td>{uiText(amount(p.amount_cents))}</td><td>{uiText(p.method)}</td><td>{p.reference || '—'}</td><td>{p.by}</td></tr>)}</tbody></table>{uiText(!payments.length && <p className="business-empty">{uiText("\u0644\u0627 \u062A\u0648\u062C\u062F \u062F\u0641\u0639\u0627\u062A \u0645\u0633\u062C\u0644\u0629.")}</p>)}</div>; }
function InvoiceForm({ requests, close, onSaved }: {
    requests: Purchase[];
    close: () => void;
    onSaved: (id: string) => Promise<void>;
}) { const [requestId, setRequestId] = useState(''), [number, setNumber] = useState(''), [date, setDate] = useState(today()), [due, setDue] = useState(''), [total, setTotal] = useState(''), [notes, setNotes] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); const token = useRef(crypto.randomUUID()); const r = requests.find(r => r.id === requestId); async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
    await business({ op: 'invoice', id: token.current, requestId, number, date, due, total, notes });
    await onSaved(token.current);
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} } return <Pop title={uiText("تسجيل فاتورة مورد")} locked={busy} close={close}><form onSubmit={submit}><fieldset disabled={busy} className="request-fields"><div className="form-body"><Field label={uiText("طلب التوريد")}><select required value={requestId} onChange={e => setRequestId(e.target.value)}><option value="">{uiText("\u0627\u062E\u062A\u0631 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0644\u0645\u0648\u0631\u062F \u0648\u0627\u0644\u0645\u0648\u0642\u0639")}</option>{requests.map(r => <option key={r.id} value={r.id}>{uiText(ref(r))} — {r.data.siteName} — {r.data.supplier?.name}</option>)}</select></Field>{uiText(!requests.length && <p className="notice">{uiText("\u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0644\u0628\u0627\u062A \u0628\u062F\u0623 \u062A\u0648\u0631\u064A\u062F\u0647\u0627. \u0627\u0639\u062A\u0645\u062F \u0637\u0644\u0628\u064B\u0627 \u062B\u0645 \u0627\u0628\u062F\u0623 \u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0645\u0646 \u0635\u0641\u062D\u0629 \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621.")}</p>)}{r && <div className="notice"><MapPin size={18}/>{r.data.siteName} · {r.data.supplier?.name}</div>}<div className="form-grid"><Field label={uiText("رقم فاتورة المورد")}><input required maxLength={80} value={number} onChange={e => setNumber(e.target.value)}/></Field><Field label={uiText("إجمالي الفاتورة بالريال (شامل الضريبة إن وجدت)")}><input required type="number" min="0.01" step="0.01" max="10000000000" value={total} onChange={e => setTotal(e.target.value)}/></Field><Field label={uiText("تاريخ الفاتورة")}><input required type="date" value={date} onChange={e => setDate(e.target.value)}/></Field><Field label={uiText("تاريخ الاستحقاق (اختياري)")}><input type="date" min={date} value={due} onChange={e => setDue(e.target.value)}/></Field></div><Field label={uiText("ملاحظات")}><textarea maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)}/></Field><p className="inline-note">{uiText("\u064A\u0645\u0643\u0646 \u062A\u0633\u062C\u064A\u0644 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0641\u0627\u062A\u0648\u0631\u0629 \u0644\u0644\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u062C\u0632\u0626\u064A \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628. \u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0643\u0645\u0627 \u0647\u064A\u061B \u064A\u0645\u0643\u0646 \u0631\u0641\u0639 \u0635\u0648\u0631\u062A\u0647\u0627 \u0628\u0639\u062F \u0627\u0644\u062D\u0641\u0638.")}</p><ErrorBox text={error}/></div><div className="modal-actions"><button className="button primary" disabled={!requests.length || busy}>{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ الفاتورة ورفع الصورة')}</button><button className="button light" type="button" onClick={close}>{uiText("\u0625\u0644\u063A\u0627\u0621")}</button></div></fieldset></form></Pop>; }
function PaymentForm({ invoice, close, onSaved }: {
    invoice: Invoice;
    close: () => void;
    onSaved: () => Promise<void>;
}) { const [value, setValue] = useState((invoice.remaining_cents / 100).toFixed(2)), [date, setDate] = useState(today()), [method, setMethod] = useState('تحويل بنكي'), [reference, setReference] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); const token = useRef(crypto.randomUUID()); return <Pop title={uiText('تسجيل دفعة — ' + invoice.number)} locked={busy} close={close}><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
    await business({ op: 'payment', id: token.current, invoiceId: invoice.id, amount: value, date, method, reference });
    await onSaved();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><fieldset disabled={busy} className="request-fields"><div className="form-body"><p>{uiText(invoice.supplierName)} · {invoice.siteName}</p><div className="notice">{uiText("\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062A\u0628\u0642\u064A: ")}<strong>{uiText(amount(invoice.remaining_cents))}{uiText(" \u0631.\u0633")}</strong></div><div className="form-grid"><Field label={uiText("المبلغ المدفوع ر.س")}><input required type="number" min="0.01" max={invoice.remaining_cents / 100} step="0.01" value={value} onChange={e => setValue(e.target.value)}/></Field><Field label={uiText("تاريخ الدفع")}><input required type="date" value={date} onChange={e => setDate(e.target.value)}/></Field><Field label={uiText("طريقة الدفع")}><select value={method} onChange={e => setMethod(e.target.value)}>{uiText(['تحويل بنكي', 'نقدي', 'بطاقة', 'أخرى'].map(m => <option key={m} value={m}>{uiText(m)}</option>))}</select></Field><Field label={uiText("رقم التحويل أو المرجع")}><input maxLength={160} value={reference} onChange={e => setReference(e.target.value)}/></Field></div><ErrorBox text={error}/></div><div className="modal-actions"><button className="button primary">{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ الدفعة')}</button><button type="button" className="button light" onClick={close}>{uiText("\u0625\u0644\u063A\u0627\u0621")}</button></div></fieldset></form></Pop>; }
function StockForm({ stock, sites, close, onSaved }: {
    stock: Stock | null;
    sites: Site[];
    close: () => void;
    onSaved: () => Promise<void>;
}) { const [siteId, setSiteId] = useState(stock?.siteId || ''), [name, setName] = useState(stock?.name || ''), [spec, setSpec] = useState(stock?.spec || ''), [unit, setUnit] = useState(stock?.unit || 'قطعة'), [kind, setKind] = useState('in'), [value, setValue] = useState(''), [date, setDate] = useState(today()), [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''); const token = useRef(crypto.randomUUID()); return <Pop title={uiText("تسجيل حركة مخزون")} locked={busy} close={close}><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
    await business({ op: 'stock', id: token.current, siteId, name, spec, unit, kind, qty: value, date, note });
    await onSaved();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><fieldset disabled={busy} className="request-fields"><div className="form-body">{uiText(stock && <p className="notice">{uiText("\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u062D\u0627\u0644\u064A: ")}{uiText(qty(stock.balance))} {uiText(stock.unit)}</p>)}<div className="form-grid"><Field label={uiText("الموقع")}><select required disabled={!!stock} value={siteId} onChange={e => setSiteId(e.target.value)}><option value="">{uiText("\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0648\u0642\u0639")}</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label={uiText("نوع الحركة")}><select value={kind} onChange={e => setKind(e.target.value)}><option value="in">{uiText("\u0625\u0636\u0627\u0641\u0629 / \u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D\u064A")}</option>{uiText(stock && <option value="out">{uiText("\u0635\u0631\u0641 / \u0627\u0633\u062A\u0647\u0644\u0627\u0643")}</option>)}</select></Field><Field label={uiText("اسم الصنف")}><input required readOnly={!!stock} maxLength={160} value={name} onChange={e => setName(e.target.value)}/></Field><Field label={uiText("الوحدة")}><input required readOnly={!!stock} maxLength={40} value={unit} onChange={e => setUnit(e.target.value)}/></Field><Field label={uiText("الكمية")}><input required type="number" min="0.000001" step="any" max={kind === 'out' ? stock?.balance : 10000000} value={value} onChange={e => setValue(e.target.value)}/></Field><Field label={uiText("التاريخ")}><input required type="date" value={date} onChange={e => setDate(e.target.value)}/></Field></div><Field label={uiText("المواصفات")}><input readOnly={!!stock} maxLength={500} value={spec} onChange={e => setSpec(e.target.value)}/></Field><Field label={uiText("سبب الحركة")}><textarea required maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder={uiText("رصيد افتتاحي، استهلاك بالموقع، أو تفاصيل الإضافة")}/></Field><ErrorBox text={error}/></div><div className="modal-actions"><button className="button primary">{uiText(busy ? 'جارٍ الحفظ…' : 'حفظ الحركة')}</button><button type="button" className="button light" onClick={close}>{uiText("\u0625\u0644\u063A\u0627\u0621")}</button></div></fieldset></form></Pop>; }
