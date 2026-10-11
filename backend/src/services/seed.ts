import type { Appointment, BusinessProfile, FollowUpCustomer, Invoice } from "../types.js";
import { addLog, getStore, setProfile } from "./store.js";

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function loadDemoDataset(businessId: string) {
  const store = getStore();
  store.invoices = store.invoices.filter((row) => row.businessId !== businessId);
  store.customers = store.customers.filter((row) => row.businessId !== businessId);
  store.appointments = store.appointments.filter((row) => row.businessId !== businessId);
  store.evidence = store.evidence.filter((row) => row.businessId !== businessId);
  store.drafts = [];

  const profile: BusinessProfile = {
    businessId,
    name: "Harbour Digital Studio",
    industry: "software",
    employeeCount: 8,
    annualRevenueSgd: 1_200_000,
    isExporting: true,
    usesDigitalTools: true,
    hasGstRegistration: true,
  };
  setProfile(profile);

  const invoices: Invoice[] = [
    ["INV-1001", "Tan Bakery Pte Ltd", "accounts@tanbakery.sg", 1280.5, 40, "unpaid"],
    ["INV-1002", "Harbour Kopi", "pay@harbourkopi.sg", 640, 14, "unpaid"],
    ["INV-1003", "Little Orchard Retail", "finance@littleorchard.sg", 2100, 52, "unpaid"],
    ["INV-1004", "East Coast Logistics", "ap@eclogistics.sg", 890, 10, "disputed"],
    ["INV-1005", "Garden Table F&B", "hello@gardentable.sg", 450, 6, "paid"],
    ["INV-1006", "Northstar Tuition", "billing@northstar.edu.sg", 1575.25, 37, "unpaid"],
  ].map(([invoiceNumber, customerName, customerEmail, amountSgd, overdueDays, status]) => ({
    id: crypto.randomUUID(),
    businessId,
    customerId: crypto.randomUUID(),
    invoiceNumber: String(invoiceNumber),
    customerName: String(customerName),
    customerEmail: String(customerEmail),
    amountSgd: Number(amountSgd),
    dueDate: daysAgo(Number(overdueDays)),
    status: status as Invoice["status"],
    reminderCount: 0,
    lastReminderAt: null,
  }));

  const customers: FollowUpCustomer[] = [
    { name: "Tan Bakery Pte Ltd", email: "accounts@tanbakery.sg", lastContactAt: daysAgo(70), notes: "Wants POS upgrade quote" },
    { name: "Harbour Kopi", email: "pay@harbourkopi.sg", lastContactAt: daysAgo(88), notes: "Asked about catering trays" },
    { name: "Little Orchard Retail", email: "finance@littleorchard.sg", lastContactAt: null, notes: "New lead from networking" },
    { name: "East Coast Logistics", email: "ap@eclogistics.sg", lastContactAt: daysAgo(21), notes: "Disputed last delivery fee" },
    { name: "Garden Table F&B", email: "hello@gardentable.sg", lastContactAt: daysAgo(3), notes: "Paid on time this month" },
    { name: "Northstar Tuition", email: "billing@northstar.edu.sg", lastContactAt: daysAgo(103), notes: "Interested in bulk stationery" },
  ].map((row) => ({
    id: crypto.randomUUID(),
    businessId,
    followUpCount: 0,
    ...row,
  }));

  const appointments: Appointment[] = [
    { customerName: "Tan Bakery Pte Ltd", customerEmail: "accounts@tanbakery.sg", startsAt: hoursFromNow(8), status: "booked" },
    { customerName: "Harbour Kopi", customerEmail: "pay@harbourkopi.sg", startsAt: hoursFromNow(18), status: "booked" },
    { customerName: "Little Orchard Retail", customerEmail: "finance@littleorchard.sg", startsAt: hoursFromNow(72), status: "booked" },
    { customerName: "Garden Table F&B", customerEmail: "hello@gardentable.sg", startsAt: daysAgo(11), status: "completed" },
    { customerName: "East Coast Logistics", customerEmail: "ap@eclogistics.sg", startsAt: hoursFromNow(40), status: "cancelled" },
  ].map((row) => ({
    id: crypto.randomUUID(),
    businessId,
    reminderCount: 0,
    ...row,
  }));

  store.invoices.unshift(...invoices);
  store.customers.unshift(...customers);
  store.appointments.unshift(...appointments);
  addLog({
    agent: "system",
    agentRunId: null,
    invoiceId: null,
    action: "load_demo_dataset",
    result: `invoices=${invoices.length}; customers=${customers.length}; bookings=${appointments.length}`,
  });

  return {
    profile,
    totals: {
      invoices: invoices.length,
      customers: customers.length,
      appointments: appointments.length,
    },
  };
}
