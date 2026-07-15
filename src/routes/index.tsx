import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Users, ShoppingCart, Package, AlertTriangle, Download, Plus, Trash2, Edit2, RotateCcw, UserRoundPlus, Phone, Mail, CalendarClock, FileText, X, Printer } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export const Route = createFileRoute('/')({
  component: ERPLayout,
})

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  analyser: string;
}

interface StockItem {
  id: number;
  item: string;
  qty: number;
  lotNumber: string;
  packSize: string;
  expiryDate: string;
  hsnCode: string;
  taxRate: number;
}

interface Order {
  id: number;
  customerId: number;
  customerName: string;
  stockId: number;
  item: string;
  lotNumber: string;
  packSize: string;
  expiryDate: string;
  hsnCode: string;
  taxRate: number;
  qty: number;
  status: string;
}

interface Lead {
  id: number; name: string; phone: string; email: string; source: string;
  interest: string; status: 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';
  notes: string; nextFollowUp: string;
}

interface InvoiceLineItem {
  stockId: number;
  item: string;
  qty: number;
  packSize: string;
  hsnCode: string;
  taxRate: number;
  unitPrice: number;
  lotNumber: string;
  expiryDate: string;
}

interface Invoice {
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lineItems: InvoiceLineItem[];
  invoiceDate: string;
  invoiceNumber: string;
  notes: string;
}

function ERPLayout() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'orders' | 'stock' | 'leads' | 'invoices'>('dashboard')
  const [customersList, setCustomers] = useState<Customer[]>([])
  const [stockList, setStock] = useState<StockItem[]>([])
  const [ordersList, setOrders] = useState<Order[]>([])
  const [leadsList, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  // Invoice states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<Invoice>({
    customerId: 0,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    lineItems: [],
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',
    notes: ''
  })
  const [invoiceLineItem, setInvoiceLineItem] = useState<InvoiceLineItem>({
    stockId: 0,
    item: '',
    qty: 1,
    packSize: '',
    hsnCode: '',
    taxRate: 0,
    unitPrice: 0,
    lotNumber: '',
    expiryDate: ''
  })
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null)

  // Form states
  const [cName, setCname] = useState('')
  const [cPhone, setCphone] = useState('')
  const [cAddr, setCaddr] = useState('')
  const [cAnalyser, setCanalyser] = useState('')
  const [cSearch, setCsearch] = useState('')

  const [sItem, setSitem] = useState('')
  const [sQty, setSqty] = useState(0)
  const [sLotNumber, setSlotNumber] = useState('')
  const [sPackSize, setSpackSize] = useState('')
  const [sExpiryDate, setSexpiryDate] = useState('')
  const [sHsnCode, setShsnCode] = useState('')
  const [sTaxRate, setStaxRate] = useState(0)
  const [sSearch, setSsearch] = useState('')

  const [oCust, setOcust] = useState('')
  const [oItem, setOitem] = useState('')
  const [oQty, setOqty] = useState(1)

  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Served'>('All')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadFilter, setLeadFilter] = useState<'All' | Lead['status']>('All')
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', source: 'Website', interest: '', status: 'New', notes: '', nextFollowUp: '' })

  // Load live data from our serverless functions API
  const fetchData = async () => {
    try {
      setLoading(true)
      const [resCust, resStock, resOrders, resLeads] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/stock'),
        fetch('/api/orders'),
        fetch('/api/leads')
      ])
      if (resCust.ok) setCustomers(await resCust.json())
      if (resStock.ok) setStock(await resStock.json())
      if (resOrders.ok) {
        const ordersData = await resOrders.json()
        setOrders(ordersData)
      }
      if (resLeads.ok) setLeads(await resLeads.json())
    } catch (e) {
      console.error('Error fetching ERP data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Quick fallback selections if dropdown state is empty but items exist
  useEffect(() => {
    if (customersList.length > 0 && !oCust) {
      setOcust(customersList[0].id.toString())
    }
  }, [customersList])

  useEffect(() => {
    if (stockList.length > 0 && !oItem) {
      setOitem(stockList[0].id.toString())
    }
  }, [stockList])

  // Invoice Handlers
  const initiateInvoice = (customerId: number) => {
    const customer = customersList.find(c => c.id === customerId)
    if (!customer) return

    setInvoiceForm({
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      lineItems: [],
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: `INV-${Date.now()}`,
      notes: ''
    })
    setInvoiceLineItem({
      stockId: 0,
      item: '',
      qty: 1,
      packSize: '',
      hsnCode: '',
      taxRate: 0,
      unitPrice: 0,
      lotNumber: '',
      expiryDate: ''
    })
    setShowInvoiceModal(true)
  }

  const addLineItemToInvoice = () => {
    if (invoiceLineItem.stockId === 0 || invoiceLineItem.qty <= 0 || invoiceLineItem.unitPrice <= 0) {
      alert('Please fill all required line item fields')
      return
    }

    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...invoiceForm.lineItems, invoiceLineItem]
    })
    setInvoiceLineItem({
      stockId: 0,
      item: '',
      qty: 1,
      packSize: '',
      hsnCode: '',
      taxRate: 0,
      unitPrice: 0,
      lotNumber: '',
      expiryDate: ''
    })
  }

  const removeLineItemFromInvoice = (index: number) => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: invoiceForm.lineItems.filter((_, i) => i !== index)
    })
  }

  const selectStockForInvoice = (stockId: number) => {
    const stock = stockList.find(s => s.id === stockId)
    if (!stock) return

    setInvoiceLineItem({
      ...invoiceLineItem,
      stockId,
      item: stock.item,
      packSize: stock.packSize,
      hsnCode: stock.hsnCode,
      taxRate: stock.taxRate,
      lotNumber: stock.lotNumber,
      expiryDate: stock.expiryDate
    })
  }

  const calculateLineTotal = (item: InvoiceLineItem) => {
    const subtotal = item.qty * item.unitPrice
    const tax = (subtotal * item.taxRate) / 100
    return subtotal + tax
  }

  const calculateInvoiceTotal = () => {
    return invoiceForm.lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0)
  }

  const calculateInvoiceTotalBeforeTax = () => {
    return invoiceForm.lineItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0)
  }

  const calculateTotalTax = () => {
    return calculateInvoiceTotal() - calculateInvoiceTotalBeforeTax()
  }

  const generateInvoicePDF = () => {
    if (invoiceForm.lineItems.length === 0) {
      alert('Cannot generate invoice without line items')
      return
    }

    setInvoicePreview({ ...invoiceForm })
  }

  const downloadInvoicePDF = () => {
    if (!invoicePreview) return

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
            .company-name { font-size: 28px; font-weight: bold; color: #1e40af; }
            .company-desc { font-size: 12px; color: #666; margin-top: 5px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .detail-section { flex: 1; }
            .detail-label { font-weight: bold; font-size: 12px; color: #666; margin-bottom: 3px; }
            .detail-value { font-size: 13px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; font-size: 12px; }
            td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
            .text-right { text-align: right; }
            .summary-section { float: right; width: 40%; margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #eee; }
            .summary-row.total { border-top: 2px solid #1e40af; font-weight: bold; font-size: 14px; margin-top: 10px; padding-top: 10px; }
            .notes { clear: both; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; }
            .low-stock { color: #dc2626; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Genius Scientific</div>
            <div class="company-desc">Enterprise Inventory & Order Management ERP</div>
          </div>

          <div class="invoice-details">
            <div class="detail-section">
              <div class="detail-label">BILL TO:</div>
              <div class="detail-value"><strong>${invoicePreview.customerName}</strong></div>
              <div class="detail-value">${invoicePreview.customerAddress}</div>
              <div class="detail-value">${invoicePreview.customerPhone}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Invoice #:</div>
              <div class="detail-value">${invoicePreview.invoiceNumber}</div>
              <div class="detail-label" style="margin-top: 10px;">Date:</div>
              <div class="detail-value">${invoicePreview.invoiceDate}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Lot/Batch</th>
                <th>HSN Code</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Tax %</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoicePreview.lineItems.map(item => {
                const subtotal = item.qty * item.unitPrice
                const tax = (subtotal * item.taxRate) / 100
                const total = subtotal + tax
                return `
                  <tr>
                    <td>${item.item} (${item.packSize})</td>
                    <td>${item.lotNumber || '—'}</td>
                    <td>${item.hsnCode || '—'}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">${item.taxRate}%</td>
                    <td class="text-right">₹${total.toFixed(2)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${calculateInvoiceTotalBeforeTax().toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Tax (GST):</span>
              <span>₹${calculateTotalTax().toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span>₹${calculateInvoiceTotal().toFixed(2)}</span>
            </div>
          </div>

          ${invoicePreview.notes ? `<div class="notes"><strong>Notes:</strong><br/>${invoicePreview.notes}</div>` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Thank you for your business!</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '', 'width=900,height=600')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportInvoiceCSV = () => {
    if (!invoicePreview || invoicePreview.lineItems.length === 0) return

    const headers = ['Item', 'Lot Number', 'HSN Code', 'Pack Size', 'Expiry Date', 'Quantity', 'Unit Price', 'Tax %', 'Total']
    const rows = invoicePreview.lineItems.map(item => [
      item.item,
      item.lotNumber || '—',
      item.hsnCode || '—',
      item.packSize || '—',
      item.expiryDate || '—',
      item.qty,
      item.unitPrice.toFixed(2),
      item.taxRate,
      calculateLineTotal(item).toFixed(2)
    ])

    const csv = [
      [`Invoice ${invoicePreview.invoiceNumber}`, '', '', '', '', '', '', '', ''],
      [`Customer: ${invoicePreview.customerName}`, '', '', '', '', '', '', '', ''],
      [`Date: ${invoicePreview.invoiceDate}`, '', '', '', '', '', '', '', ''],
      [],
      headers,
      ...rows,
      [],
      ['', '', '', '', 'Subtotal:', '', '', '', calculateInvoiceTotalBeforeTax().toFixed(2)],
      ['', '', '', '', 'Tax:', '', '', '', calculateTotalTax().toFixed(2)],
      ['', '', '', '', 'TOTAL:', '', '', '', calculateInvoiceTotal().toFixed(2)]
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${invoicePreview.invoiceNumber}.csv`
    a.click()
  }

  // Handlers
  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cName || !/^\d+$/.test(cPhone)) {
      alert("Invalid Name or Phone (digits only)")
      return
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cName, phone: cPhone, address: cAddr, analyser: cAnalyser })
      })
      if (res.ok) {
        setCname('')
        setCphone('')
        setCaddr('')
        setCanalyser('')
        await fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add customer')
      }
    } catch (err) {
      alert('Error connecting to database')
    }
  }

  const editCustomer = async (cust: Customer) => {
    const name = prompt("Edit Name:", cust.name) || cust.name
    const phone = prompt("Edit Phone:", cust.phone) || cust.phone
    if (!/^\d+$/.test(phone)) {
      alert("Invalid Phone (digits only)")
      return
    }
    const address = prompt("Edit Address:", cust.address) ?? cust.address
    const analyser = prompt("Edit Analyser:", cust.analyser) ?? cust.analyser

    try {
      const res = await fetch(`/api/customers/${cust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, analyser })
      })
      if (res.ok) await fetchData()
    } catch (err) {
      alert('Error updating customer')
    }
  }

  const deleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer? This will delete their orders as well.")) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchData()
    } catch (err) {
      alert('Error deleting customer')
    }
  }

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sItem) return
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: sItem, qty: sQty, lotNumber: sLotNumber, packSize: sPackSize, expiryDate: sExpiryDate, hsnCode: sHsnCode, taxRate: sTaxRate })
      })
      if (res.ok) {
        setSitem('')
        setSqty(0)
        setSlotNumber('')
        setSpackSize('')
        setSexpiryDate('')
        setShsnCode('')
        setStaxRate(0)
        await fetchData()
      }
    } catch (err) {
      alert('Error adding stock')
    }
  }

  const adjustStock = async (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.qty + delta)
    try {
      const res = await fetch(`/api/stock/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: newQty })
      })
      if (res.ok) await fetchData()
    } catch (err) {
      alert('Error adjusting stock')
    }
  }

  const deleteStock = async (id: number) => {
    if (!confirm("Are you sure you want to delete this stock item?")) return
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchData()
    } catch (err) {
      alert('Error deleting stock')
    }
  }

  const addOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetCust = oCust || (customersList[0] ? customersList[0].id.toString() : '')
    const targetItem = oItem || (stockList[0] ? stockList[0].id.toString() : '')

    if (!targetCust || !targetItem) {
      alert("Please ensure both a customer and a stock item are selected.")
      return
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: targetCust, stockId: targetItem, qty: oQty })
      })
      if (res.ok) {
        setOqty(1)
        await fetchData()
        setActiveTab('orders')
      }
    } catch (err) {
      alert('Error placing order')
    }
  }

  const serveOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'serve' })
      })
      if (res.ok) {
        await fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to serve order')
      }
    } catch (err) {
      alert('Error serving order')
    }
  }

  const deleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order?")) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchData()
    } catch (err) {
      alert('Error deleting order')
    }
  }

  const saveLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadForm.name.trim()) return
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadForm) })
      if (res.ok) {
        setLeadForm({ name: '', phone: '', email: '', source: 'Website', interest: '', status: 'New', notes: '', nextFollowUp: '' })
        await fetchData()
      }
    } catch { alert('Error saving lead') }
  }

  const updateLeadStatus = async (lead: Lead, status: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, status }) })
      if (res.ok) await fetchData()
    } catch { alert('Error updating lead') }
  }

  const editLead = async (lead: Lead) => {
    const notes = prompt('Update notes:', lead.notes)
    if (notes === null) return
    const nextFollowUp = prompt('Next follow-up (YYYY-MM-DD):', lead.nextFollowUp)
    if (nextFollowUp === null) return
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, notes, nextFollowUp }) })
      if (res.ok) await fetchData()
    } catch { alert('Error updating lead') }
  }

  const deleteLead = async (id: number) => {
    if (!confirm('Delete this lead?')) return
    try { if ((await fetch(`/api/leads/${id}`, { method: 'DELETE' })).ok) await fetchData() } catch { alert('Error deleting lead') }
  }

  const resetAllData = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently wipe all Customers, Stock, and Orders from the database. Do you wish to proceed?")) return
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (res.ok) {
        await fetchData()
        alert('All database tables successfully wiped.')
      }
    } catch (err) {
      alert('Error resetting database')
    }
  }

  const exportOrders = () => {
    const csv = "Customer,Item,Lot Number,Pack Size,Expiry,HSN Code,Tax %,Qty,Status\n" + ordersList.map(o => `"${o.customerName}","${o.item}","${o.lotNumber}","${o.packSize}","${o.expiryDate}","${o.hsnCode}",${o.taxRate},${o.qty},"${o.status}"`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genius_orders.csv';
    a.click();
  }

  // Filters & Counts
  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(cSearch.toLowerCase()) ||
    c.analyser.toLowerCase().includes(cSearch.toLowerCase())
  )

  const filteredStock = stockList.filter(s =>
    [s.item, s.lotNumber, s.packSize, s.hsnCode].some(value => value.toLowerCase().includes(sSearch.toLowerCase()))
  )

  const filteredOrders = ordersList.filter(o => {
    if (orderFilter === 'All') return true
    return o.status === orderFilter
  })
  const filteredLeads = leadsList.filter(lead => (leadFilter === 'All' || lead.status === leadFilter) &&
    [lead.name, lead.phone, lead.email, lead.source, lead.interest].some(value => value.toLowerCase().includes(leadSearch.toLowerCase())))

  const lowStockCount = stockList.filter(s => s.qty <= 3).length
  const pendingOrdersCount = ordersList.filter(o => o.status === 'Pending').length
  const servedOrdersCount = ordersList.filter(o => o.status === 'Served').length
  const openLeadsCount = leadsList.filter(l => !['Won', 'Lost'].includes(l.status)).length
  const dueFollowUpsCount = leadsList.filter(l => l.nextFollowUp && l.nextFollowUp <= new Date().toISOString().slice(0, 10) && !['Won', 'Lost'].includes(l.status)).length

  // Charts configuration
  const stockChartData = {
    labels: stockList.map(s => s.item),
    datasets: [{
      label: 'Inventory Level',
      data: stockList.map(s => s.qty),
      backgroundColor: stockList.map(s => s.qty <= 3 ? '#ef4444' : '#3b82f6'),
      borderRadius: 4
    }]
  }

  const orderStatsData = {
    labels: ['Pending', 'Served'],
    datasets: [{
      data: [pendingOrdersCount, servedOrdersCount],
      backgroundColor: ['#f59e0b', '#10b981'],
      borderWidth: 0
    }]
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-white text-blue-600 p-2 rounded-lg font-bold text-xl shadow-inner">GS</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Genius Scientific</h1>
              <p className="text-xs text-blue-100 font-medium">Enterprise Inventory & Order Management ERP</p>
            </div>
          </div>
          <div className="flex w-full md:w-auto items-center gap-1.5 sm:gap-3 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'customers' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'orders' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-1 ${activeTab === 'invoices' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              <FileText className="w-4 h-4" /> Invoices
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${activeTab === 'leads' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'stock' ? 'bg-blue-700 shadow-inner text-white' : 'hover:bg-blue-500 text-blue-50'}`}
            >
              Stock
            </button>
            <button
              onClick={resetAllData}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 shadow-md transition whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Wipe Database
            </button>
          </div>
        </div>
      </header>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold">Create Invoice for {invoiceForm.customerName}</h3>
              <button onClick={() => { setShowInvoiceModal(false); setInvoicePreview(null) }} className="p-1 hover:bg-blue-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Invoice Number</label>
                  <input value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Invoice Date</label>
                  <input type="date" value={invoiceForm.invoiceDate} onChange={e => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                </div>
              </div>

              {/* Add Line Items */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <h4 className="font-bold text-slate-700">Add Items to Invoice</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Select Stock Item</label>
                    <select value={invoiceLineItem.stockId} onChange={e => selectStockForInvoice(parseInt(e.target.value))} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none mt-1">
                      <option value={0}>— Choose Item —</option>
                      {stockList.map(s => <option key={s.id} value={s.id}>{s.item} ({s.packSize}) - Stock: {s.qty}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Quantity</label>
                    <input type="number" min="1" value={invoiceLineItem.qty} onChange={e => setInvoiceLineItem({ ...invoiceLineItem, qty: Math.max(1, parseInt(e.target.value) || 1) })} placeholder="Qty" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Unit Price (₹)</label>
                    <input type="number" min="0" step="0.01" value={invoiceLineItem.unitPrice} onChange={e => setInvoiceLineItem({ ...invoiceLineItem, unitPrice: parseFloat(e.target.value) || 0 })} placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Tax Rate %</label>
                    <select value={invoiceLineItem.taxRate} onChange={e => setInvoiceLineItem({ ...invoiceLineItem, taxRate: parseInt(e.target.value) })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none mt-1">
                      <option value={0}>0%</option>
                      <option value={3}>3%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <button onClick={addLineItemToInvoice} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
                  + Add Line Item
                </button>
              </div>

              {/* Line Items Summary */}
              {invoiceForm.lineItems.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-left">Item</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Tax</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceForm.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="p-3">{item.item}</td>
                          <td className="p-3 text-right">{item.qty}</td>
                          <td className="p-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.taxRate}%</td>
                          <td className="p-3 text-right font-semibold">₹{calculateLineTotal(item).toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => removeLineItemFromInvoice(idx)} className="text-rose-600 hover:bg-rose-50 p-1 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="bg-slate-50 p-4 space-y-2">
                    <div className="flex justify-end gap-20">
                      <span className="font-semibold">Subtotal:</span>
                      <span>₹{calculateInvoiceTotalBeforeTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-end gap-20">
                      <span className="font-semibold">Tax (GST):</span>
                      <span>₹{calculateTotalTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-end gap-20 text-lg font-bold text-blue-600 pt-2 border-t-2">
                      <span>TOTAL:</span>
                      <span>₹{calculateInvoiceTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Additional Notes</label>
                <textarea value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Payment terms, delivery instructions, etc." className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1 min-h-20" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button onClick={() => { setShowInvoiceModal(false); setInvoicePreview(null) }} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold">
                  Close
                </button>
                <button onClick={generateInvoicePDF} disabled={invoiceForm.lineItems.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
                  Preview & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-emerald-600 text-white p-4 flex justify-between items-center rounded-t-xl">
              <h3 className="text-xl font-bold">Invoice Preview</h3>
              <button onClick={() => setInvoicePreview(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 pb-4">
                <h1 className="text-3xl font-bold text-blue-600">Genius Scientific</h1>
                <p className="text-sm text-slate-500">Enterprise Inventory & Order Management ERP</p>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">BILL TO:</h4>
                  <p className="font-semibold text-slate-800">{invoicePreview.customerName}</p>
                  <p className="text-sm text-slate-600">{invoicePreview.customerAddress}</p>
                  <p className="text-sm text-slate-600">{invoicePreview.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Invoice #:</span> {invoicePreview.invoiceNumber}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Date:</span> {invoicePreview.invoiceDate}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-left">Lot</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicePreview.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-3">{item.item} ({item.packSize})</td>
                        <td className="p-3 text-sm text-slate-600">{item.lotNumber || '—'}</td>
                        <td className="p-3 text-right">{item.qty}</td>
                        <td className="p-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right">{item.taxRate}%</td>
                        <td className="p-3 text-right font-semibold">₹{calculateLineTotal(item).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full md:w-80 space-y-2 border-t-2 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateInvoiceTotalBeforeTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST):</span>
                    <span>₹{calculateTotalTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2">
                    <span>TOTAL:</span>
                    <span>₹{calculateInvoiceTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {invoicePreview.notes && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-2">Notes:</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{invoicePreview.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button onClick={() => setInvoicePreview(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold">
                  Back
                </button>
                <button onClick={exportInvoiceCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={downloadInvoicePDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  <Printer className="w-4 h-4" /> Print PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 font-medium">Syncing with live database...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Section */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                  <div
                    onClick={() => { setActiveTab('orders'); setOrderFilter('Pending') }}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between cursor-pointer hover:shadow transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-400">Pending Orders</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{pendingOrdersCount}</h3>
                    </div>
                    <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                  <div onClick={() => setActiveTab('leads')} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:shadow transition">
                    <div><p className="text-sm font-medium text-slate-400">Open Leads</p><h3 className="text-3xl font-extrabold text-slate-800 mt-1">{openLeadsCount}</h3></div>
                    <div className="bg-violet-100 text-violet-600 p-3 rounded-xl"><UserRoundPlus className="w-6 h-6" /></div>
                  </div>

                  <div
                    onClick={() => { setActiveTab('orders'); setOrderFilter('Served') }}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between cursor-pointer hover:shadow transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-400">Served Orders</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{servedOrdersCount}</h3>
                    </div>
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('customers')}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between cursor-pointer hover:shadow transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-400">Total Customers</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{customersList.length}</h3>
                    </div>
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('stock')}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between cursor-pointer hover:shadow transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-400">Low Stock Warnings</p>
                      <h3 className={`text-3xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {lowStockCount}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                      {lowStockCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                    </div>
                  </div>
                </div>

                {/* Dashboard Visualization Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stock Level Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                    <h4 className="text-lg font-bold text-slate-700 mb-4">Stock Levels</h4>
                    {stockList.length > 0 ? (
                      <div className="h-[280px]">
                        <Bar
                          data={stockChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center text-slate-400">
                        No stock item data available.
                      </div>
                    )}
                  </div>

                  {/* Orders Breakdown */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-700 mb-4">Order Breakdown</h4>
                    {ordersList.length > 0 ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <Doughnut
                          data={orderStatsData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center text-slate-400">
                        No order statistics available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customers Section */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" /> Add New Customer
                  </h4>
                  <form onSubmit={addCustomer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                      value={cName}
                      onChange={e => setCname(e.target.value)}
                      placeholder="Customer Name"
                      required
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      value={cPhone}
                      onChange={e => setCphone(e.target.value)}
                      placeholder="Phone (digits only)"
                      required
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      value={cAddr}
                      onChange={e => setCaddr(e.target.value)}
                      placeholder="Address"
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      value={cAnalyser}
                      onChange={e => setCanalyser(e.target.value)}
                      placeholder="Analyser ID/Model"
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white rounded-lg p-2.5 text-sm font-semibold hover:bg-blue-700 transition shadow col-span-full sm:col-span-1"
                    >
                      Save Customer
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4 className="text-lg font-bold text-slate-700">Customers Database</h4>
                    <input
                      value={cSearch}
                      onChange={e => setCsearch(e.target.value)}
                      placeholder="Search by name or analyser..."
                      className="w-full sm:w-80 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                          <th className="py-3 px-4 font-semibold">Name</th>
                          <th className="py-3 px-4 font-semibold">Phone</th>
                          <th className="py-3 px-4 font-semibold">Address</th>
                          <th className="py-3 px-4 font-semibold">Analyser</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(cust => (
                          <tr key={cust.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-700">{cust.name}</td>
                            <td className="py-3 px-4 text-slate-500">{cust.phone}</td>
                            <td className="py-3 px-4 text-slate-500">{cust.address}</td>
                            <td className="py-3 px-4 text-slate-500">{cust.analyser || 'N/A'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => initiateInvoice(cust.id)}
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                                  title="Create Invoice"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => editCustomer(cust)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteCustomer(cust.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400">No customers found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Section */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-emerald-600" />
                    <h4 className="text-2xl font-bold text-slate-700">Invoice Generation</h4>
                  </div>
                  <p className="text-slate-600 text-sm">Create professional invoices for your customers with line-item details, GST calculations, and export options.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h4 className="text-lg font-bold text-slate-700 mb-6">Select Customer to Create Invoice</h4>
                  
                  {customersList.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 mb-4">No customers available. Please create customers first.</p>
                      <button
                        onClick={() => setActiveTab('customers')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                      >
                        Go to Customers
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customersList.map(cust => (
                        <div key={cust.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                          <h5 className="font-bold text-slate-700 mb-2">{cust.name}</h5>
                          <p className="text-xs text-slate-500 mb-1">📞 {cust.phone}</p>
                          <p className="text-xs text-slate-500 mb-1">📍 {cust.address}</p>
                          <p className="text-xs text-slate-500 mb-4">{cust.analyser && `⚙️ ${cust.analyser}`}</p>
                          <button
                            onClick={() => initiateInvoice(cust.id)}
                            className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Create Invoice
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Section */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" /> Create New Order
                  </h4>
                  {customersList.length === 0 || stockList.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      You must add at least one customer and one stock item before placing an order.
                    </p>
                  ) : (
                    <form onSubmit={addOrder} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-400">Select Customer</label>
                        <select
                          value={oCust}
                          onChange={e => setOcust(e.target.value)}
                          className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {customersList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-400">Select Stock Item</label>
                        <select
                          value={oItem}
                          onChange={e => setOitem(e.target.value)}
                          className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {stockList.map(s => <option key={s.id} value={s.id}>{s.item} — Lot {s.lotNumber || 'N/A'} — Qty: {s.qty}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-400">Quantity</label>
                        <input
                          type="number"
                          value={oQty}
                          onChange={e => setOqty(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-lg p-2.5 text-sm font-semibold hover:bg-blue-700 transition shadow mt-auto"
                      >
                        Submit Order
                      </button>
                    </form>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4 className="text-lg font-bold text-slate-700 flex items-center gap-3">
                      Orders Log
                      <button
                        onClick={exportOrders}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV Export
                      </button>
                    </h4>

                    {/* Order filters */}
                    <div className="flex gap-2">
                      {(['All', 'Pending', 'Served'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setOrderFilter(f)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${orderFilter === f ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                          <th className="py-3 px-4 font-semibold">Customer</th>
                          <th className="py-3 px-4 font-semibold">Stock Item</th>
                          <th className="py-3 px-4 font-semibold">Quantity</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => (
                          <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-700">{order.customerName}</td>
                            <td className="py-3 px-4 text-slate-500">{order.item}</td>
                            <td className="py-3 px-4 text-slate-500">{order.qty}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {order.status === 'Pending' && (
                                  <button
                                    onClick={() => serveOrder(order.id)}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-md"
                                  >
                                    Serve
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteOrder(order.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Leads Section */}
            {activeTab === 'leads' && (
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2"><UserRoundPlus className="w-5 h-5 text-violet-600" /> Capture a lead</h4>
                    {dueFollowUpsCount > 0 && <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">{dueFollowUpsCount} follow-up{dueFollowUpsCount === 1 ? '' : 's'} due</span>}
                  </div>
                  <form onSubmit={saveLead} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <input value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Lead name *" required className="field" />
                    <input value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone" inputMode="tel" className="field" />
                    <input value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="Email" type="email" className="field" />
                    <select value={leadForm.source} onChange={e => setLeadForm({ ...leadForm, source: e.target.value })} className="field"><option>Website</option><option>Referral</option><option>Walk-in</option><option>Call</option><option>Social media</option><option>Other</option></select>
                    <input value={leadForm.interest} onChange={e => setLeadForm({ ...leadForm, interest: e.target.value })} placeholder="Product / service interest" className="field" />
                    <select value={leadForm.status} onChange={e => setLeadForm({ ...leadForm, status: e.target.value })} className="field"><option>New</option><option>Contacted</option><option>Qualified</option><option>Won</option><option>Lost</option></select>
                    <input type="date" value={leadForm.nextFollowUp} onChange={e => setLeadForm({ ...leadForm, nextFollowUp: e.target.value })} aria-label="Next follow-up" className="field" />
                    <button type="submit" className="bg-violet-600 text-white rounded-lg p-2.5 text-sm font-semibold hover:bg-violet-700 transition shadow">Save lead</button>
                    <textarea value={leadForm.notes} onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })} placeholder="Notes or next steps" className="field sm:col-span-2 lg:col-span-4 min-h-20" />
                  </form>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col gap-4 mb-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center"><h4 className="text-lg font-bold text-slate-700">Lead pipeline <span className="text-sm font-medium text-slate-400">({filteredLeads.length})</span></h4><input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search leads..." className="field w-full sm:w-72" /></div>
                    <div className="flex gap-2 overflow-x-auto pb-1">{(['All', 'New', 'Contacted', 'Qualified', 'Won', 'Lost'] as const).map(status => <button key={status} onClick={() => setLeadFilter(status)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg border transition ${leadFilter === status ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{status}</button>)}</div>
                  </div>
                  <div className="grid grid-cols-1 lg:hidden gap-3">{filteredLeads.map(lead => <div key={lead.id} className="rounded-xl border border-slate-200 p-4 space-y-3"><div className="flex justify-between gap-3"><div><p className="font-bold text-slate-700">{lead.name}</p><p className="text-xs text-slate-400">{lead.source} · {lead.interest || 'No interest set'}</p></div><select value={lead.status} onChange={e => updateLeadStatus(lead, e.target.value as Lead['status'])} className="text-xs font-bold border rounded-lg p-1.5"><option>New</option><option>Contacted</option><option>Qualified</option><option>Won</option><option>Lost</option></select></div><div className="text-sm text-slate-500 space-y-1">{lead.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{lead.phone}</p>}{lead.email && <p className="flex items-center gap-2 break-all"><Mail className="w-3.5 h-3.5" />{lead.email}</p>}{lead.nextFollowUp && <p className={`flex items-center gap-2 ${lead.nextFollowUp <= new Date().toISOString().slice(0, 10) && !['Won', 'Lost'].includes(lead.status) ? 'text-rose-600 font-semibold' : ''}`}><CalendarClock className="w-3.5 h-3.5" />Follow up: {lead.nextFollowUp}</p>}</div>{lead.notes && <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-2">{lead.notes}</p>}<div className="flex justify-end gap-2"><button onClick={() => editLead(lead)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteLead(lead.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>
                  <div className="hidden lg:block overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-slate-50 text-slate-500"><th className="p-3">Lead</th><th className="p-3">Source / interest</th><th className="p-3">Follow-up</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{filteredLeads.map(lead => <tr key={lead.id} className="border-b border-slate-100"><td className="p-3"><p className="font-semibold text-slate-700">{lead.name}</p><p className="text-xs text-slate-400">{lead.phone} {lead.email && `· ${lead.email}`}</p></td><td className="p-3 text-slate-500"><p>{lead.source}</p><p className="text-xs">{lead.interest || '—'}</p></td><td className={`p-3 ${lead.nextFollowUp && lead.nextFollowUp <= new Date().toISOString().slice(0, 10) && !['Won', 'Lost'].includes(lead.status) ? 'font-bold text-rose-600' : 'text-slate-500'}`}>{lead.nextFollowUp || '—'}</td><td className="p-3"><select value={lead.status} onChange={e => updateLeadStatus(lead, e.target.value as Lead['status'])} className="border rounded-lg px-2 py-1 text-xs font-bold"><option>New</option><option>Contacted</option><option>Qualified</option><option>Won</option><option>Lost</option></select></td><td className="p-3 text-right"><button onClick={() => editLead(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteLead(lead.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>
                  {filteredLeads.length === 0 && <p className="text-center py-8 text-slate-400">No leads found.</p>}
                </div>
              </div>
            )}

            {/* Stock Section */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" /> Add Stock Item
                  </h4>
                  <form onSubmit={addStock} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                      value={sItem}
                      onChange={e => setSitem(e.target.value)}
                      placeholder="Item Name / Description"
                      required
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="number"
                      value={sQty}
                      onChange={e => setSqty(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Quantity"
                      required
                      className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input value={sLotNumber} onChange={e => setSlotNumber(e.target.value)} placeholder="Lot / Batch Number" className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input value={sPackSize} onChange={e => setSpackSize(e.target.value)} placeholder="Pack Size (e.g. 100 ml)" className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="date" value={sExpiryDate} onChange={e => setSexpiryDate(e.target.value)} aria-label="Expiry date" className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input value={sHsnCode} onChange={e => setShsnCode(e.target.value)} placeholder="HSN Code" inputMode="numeric" className="border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <select value={sTaxRate} onChange={e => setStaxRate(Number(e.target.value))} className="border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" aria-label="GST tax rate">
                      <option value={0}>GST / Tax: 0%</option><option value={3}>GST / Tax: 3%</option><option value={5}>GST / Tax: 5%</option><option value={12}>GST / Tax: 12%</option><option value={18}>GST / Tax: 18%</option><option value={28}>GST / Tax: 28%</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white rounded-lg p-2.5 text-sm font-semibold hover:bg-blue-700 transition shadow"
                    >
                      Save Stock Item
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4 className="text-lg font-bold text-slate-700">Inventory Registry</h4>
                    <input
                      value={sSearch}
                      onChange={e => setSsearch(e.target.value)}
                      placeholder="Search stock..."
                      className="w-full sm:w-80 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                          <th className="py-3 px-4 font-semibold">Item</th>
                          <th className="py-3 px-4 font-semibold">Lot / Batch</th>
                          <th className="py-3 px-4 font-semibold">Pack Size</th>
                          <th className="py-3 px-4 font-semibold">Expiry</th>
                          <th className="py-3 px-4 font-semibold">HSN</th>
                          <th className="py-3 px-4 font-semibold">GST</th>
                          <th className="py-3 px-4 font-semibold">Qty</th>
                          <th className="py-3 px-4 font-semibold">Inline Adjustments</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStock.map(stk => (
                          <tr
                            key={stk.id}
                            className={`border-b border-slate-50 hover:bg-slate-50/50 ${stk.qty <= 3 ? 'bg-rose-50/30' : ''}`}
                          >
                            <td className="py-3 px-4 font-medium text-slate-700 flex items-center gap-2">
                              {stk.qty <= 3 && <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />}
                              {stk.item}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{stk.lotNumber || '—'}</td>
                            <td className="py-3 px-4 text-slate-500">{stk.packSize || '—'}</td>
                            <td className="py-3 px-4 text-slate-500">{stk.expiryDate || '—'}</td>
                            <td className="py-3 px-4 text-slate-500">{stk.hsnCode || '—'}</td>
                            <td className="py-3 px-4 text-slate-500">{stk.taxRate}%</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${stk.qty <= 3 ? 'bg-rose-100 text-rose-800' : 'bg-blue-50 text-blue-800'}`}>
                                {stk.qty} {stk.qty <= 3 ? '(Low Stock)' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => adjustStock(stk, -1)}
                                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => adjustStock(stk, 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => deleteStock(stk.id)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredStock.length === 0 && (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-slate-400">No stock items found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
