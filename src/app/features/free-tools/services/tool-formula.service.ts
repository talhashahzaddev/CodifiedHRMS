import { Injectable } from '@angular/core';
import { ToolResult } from '../models/tool-result.model';

/**
 * ToolFormulaService
 * ─────────────────────────────────────────────────────────────────────────────
 * Central computation engine for all 28 free tools.
 * Each tool slug maps to a private method that receives the form values
 * (keyed exactly as the ToolField.key in tools.config.ts) and returns
 * an array of ToolResult objects to display in the ResultBoxComponent.
 *
 * Complex tools that require custom UI (time-card, timetable, time-tracker,
 * event-qr, banner-generator, upi-qr) return [] here and are handled by
 * dedicated tool components wired in Step 4.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable({ providedIn: 'root' })
export class ToolFormulaService {

  /** Entry point — dispatch to the correct formula by slug. */
  calculate(slug: string, values: Record<string, any>): ToolResult[] {
    switch (slug) {
      // ── Workforce Tools ─────────────────────────────────────
      case 'absence-percentage-calculator':      return this.absencePercentage(values);
      case 'attrition-rate-calculator':          return this.attritionRate(values);
      case 'employee-retention-rate-calculator': return this.retentionRate(values);
      case 'overtime-calculator':                return this.overtimeCalc(values);
      case 'shift-differential-calculator':      return this.shiftDifferential(values);
      case 'pto-calculator':                     return this.ptoCalc(values);
      case 'leave-encashment-calculator':        return this.leaveEncashment(values);
      case 'fte-calculator':                     return this.fteCalc(values);
      case 'utilization-rate-calculator':        return this.utilizationRate(values);
      case 'billable-hours-calculator':          return this.billableHours(values);
      case 'project-cost-calculator':            return this.projectCost(values);
      case 'completion-percentage-calculator':   return this.completionPct(values);
      case 'schedule-variance-calculator':       return this.scheduleVariance(values);
      // time-card-calculator → needs custom day-row UI; handled in Step 4
      case 'time-card-calculator':               return [];

      // ── Utility Tools ───────────────────────────────────────
      case 'time-difference-calculator':   return this.timeDifference(values);
      case 'unix-timestamp-converter':     return this.unixTimestamp(values);
      case 'iso-time-formatter':           return this.isoFormatter(values);
      case 'gmt-timestamp':               return this.gmtTimestamp();
      case 'age-calculator':               return this.ageCalc(values);
      case 'age-difference-calculator':    return this.ageDifference(values);
      case 'mailto-link-generator':        return this.mailtoLink(values);
      case 'add-to-calendar-link-generator': return this.calendarLinks(values);
      case 'time-zone-converter':          return this.timeZoneConvert(values);
      // Complex UI tools — handled in Step 4
      case 'event-qr-generator':
      case 'upi-qr-generator':
      case 'banner-generator':
      case 'timetable-generator':
      case 'time-tracker':               return [];

      default: return [];
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WORKFORCE TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  private absencePercentage(v: any): ToolResult[] {
    const absent    = this.n(v.absentDays);
    const employees = Math.max(1, this.n(v.employees));
    const workdays  = Math.max(1, this.n(v.workdays));
    const totalAvailable = employees * workdays;
    const rate = (absent / totalAvailable) * 100;

    return [
      { label: 'Absence Percentage', value: this.pct(rate), unit: '%', highlight: true },
      { label: 'Total Available Days', value: totalAvailable.toLocaleString(), unit: 'days' },
      { label: 'Benchmark', value: rate < 3 ? 'Excellent  (< 3%)' : rate < 5 ? 'Moderate  (3–5%)' : 'High  (> 5%)', isError: rate >= 5 },
      { label: 'Days Lost per Employee', value: this.fix2(absent / employees), unit: 'days' }
    ];
  }

  private attritionRate(v: any): ToolResult[] {
    const left  = this.n(v.employeesLeft);
    const start = Math.max(1, this.n(v.startHeadcount));
    const end   = Math.max(1, this.n(v.endHeadcount));
    const avg   = (start + end) / 2;
    const rate  = (left / avg) * 100;
    const retention = 100 - rate;

    return [
      { label: 'Attrition Rate', value: this.pct(rate), unit: '%', highlight: true, isError: rate > 20 },
      { label: 'Implied Retention Rate', value: this.pct(retention), unit: '%' },
      { label: 'Average Headcount', value: this.fix1(avg), unit: 'employees' },
      { label: 'Industry Benchmark', value: rate < 10 ? 'Low (Good)' : rate < 20 ? 'Average' : 'High (Action needed)', isError: rate >= 20 }
    ];
  }

  private retentionRate(v: any): ToolResult[] {
    const start    = Math.max(1, this.n(v.startHeadcount));
    const end      = this.n(v.endHeadcount);
    const newHires = this.n(v.newHires);
    const retained = end - newHires;
    const rate     = (retained / start) * 100;

    return [
      { label: 'Retention Rate', value: this.pct(rate), unit: '%', highlight: true },
      { label: 'Employees Retained', value: Math.max(0, retained).toFixed(0), unit: 'people' },
      { label: 'Employees Lost', value: Math.max(0, start - retained).toFixed(0), unit: 'people' },
      { label: 'Benchmark', value: rate >= 85 ? 'Excellent (≥ 85%)' : rate >= 70 ? 'Average (70–85%)' : 'Below Average (< 70%)', isError: rate < 70 }
    ];
  }

  private overtimeCalc(v: any): ToolResult[] {
    const regular   = this.n(v.regularHours);
    const ot        = this.n(v.overtimeHours);
    const rate      = this.n(v.hourlyRate);
    const mult      = Math.max(1, this.n(v.otMultiplier) || 1.5);

    const regularPay = regular * rate;
    const otPay      = ot * rate * mult;
    const totalPay   = regularPay + otPay;
    const totalHours = regular + ot;

    return [
      { label: 'Total Gross Pay', value: this.money(totalPay), unit: '$', highlight: true },
      { label: 'Regular Pay', value: this.money(regularPay), unit: '$' },
      { label: 'Overtime Pay', value: this.money(otPay), unit: '$' },
      { label: 'Total Hours Worked', value: this.fix1(totalHours), unit: 'hrs' },
      { label: 'Effective Hourly Rate', value: this.money(totalHours > 0 ? totalPay / totalHours : 0), unit: '$/hr' }
    ];
  }

  private shiftDifferential(v: any): ToolResult[] {
    const base  = this.n(v.baseRate);
    const diff  = this.n(v.differential);
    const hours = this.n(v.hoursWorked);

    const adjustedRate   = base * (1 + diff / 100);
    const differential$  = base * (diff / 100);
    const totalEarnings  = adjustedRate * hours;
    const baseEarnings   = base * hours;
    const extraEarnings  = totalEarnings - baseEarnings;

    return [
      { label: 'Adjusted Hourly Rate', value: this.money(adjustedRate), unit: '$/hr', highlight: true },
      { label: 'Total Shift Earnings', value: this.money(totalEarnings), unit: '$', highlight: true },
      { label: 'Base Earnings', value: this.money(baseEarnings), unit: '$' },
      { label: 'Shift Differential Premium', value: this.money(extraEarnings), unit: '$' },
      { label: 'Differential Amount', value: this.money(differential$), unit: '$/hr extra' }
    ];
  }

  private ptoCalc(v: any): ToolResult[] {
    const annual         = this.n(v.annualPto);
    const payPeriods     = Math.max(1, this.n(v.payPeriods) || 26);
    const periodsWorked  = this.n(v.periodsWorked);
    const daysUsed       = this.n(v.daysUsed);

    const accrualRate = annual / payPeriods;
    const accrued     = accrualRate * periodsWorked;
    const balance     = accrued - daysUsed;
    const remaining   = payPeriods - periodsWorked;
    const projectedBalance = balance + (accrualRate * remaining);

    return [
      { label: 'Current PTO Balance', value: this.fix2(balance), unit: 'days', highlight: true, isError: balance < 0 },
      { label: 'Accrual Rate', value: this.fix3(accrualRate), unit: 'days/period' },
      { label: 'Total Accrued to Date', value: this.fix2(accrued), unit: 'days' },
      { label: 'Days Used', value: this.fix1(daysUsed), unit: 'days' },
      { label: 'Projected Year-End Balance', value: this.fix2(projectedBalance), unit: 'days' }
    ];
  }

  private leaveEncashment(v: any): ToolResult[] {
    const type   = v.employeeType ?? 'private';
    const basic  = this.n(v.basicSalary);
    const days   = this.n(v.leaveBalance);
    const years  = this.n(v.yearsOfService);

    const dailyRate   = basic / 26;
    const actualAmt   = dailyRate * days;

    if (type === 'govt') {
      return [
        { label: 'Leave Encashment Amount', value: this.inr(actualAmt), unit: '₹', highlight: true },
        { label: 'Daily Rate (Basic ÷ 26)', value: this.inr(dailyRate), unit: '₹/day' },
        { label: 'Tax Exemption', value: 'Fully Exempt', description: 'Govt employees fully exempt u/s 10(10AA)' },
        { label: 'Taxable Amount', value: '₹ 0.00', highlight: false }
      ];
    }

    // Private sector — least of four limits per Sec 10(10AA)
    const limit1 = actualAmt;               // actual encashment
    const limit2 = 2500000;                  // ₹25 lakh statutory cap
    const limit3 = basic * 10;              // 10 months' basic
    const maxEarnedLeaveDays = Math.min(days, years * 30); // 30 days/year cap
    const limit4 = dailyRate * maxEarnedLeaveDays;

    const exemption = Math.min(limit1, limit2, limit3, limit4);
    const taxable   = Math.max(0, actualAmt - exemption);

    return [
      { label: 'Leave Encashment Amount', value: this.inr(actualAmt), unit: '₹', highlight: true },
      { label: 'Tax Exemption [Sec 10(10AA)]', value: this.inr(exemption), unit: '₹' },
      { label: 'Taxable Leave Encashment', value: this.inr(taxable), unit: '₹', isError: taxable > 0 },
      { label: 'Daily Rate (Basic ÷ 26)', value: this.inr(dailyRate), unit: '₹/day' },
      { label: 'Statutory Cap Applied', value: this.inr(Math.min(limit1, limit2, limit3, limit4)), unit: '₹', description: 'Min of 4 limits under Sec 10(10AA)' }
    ];
  }

  private fteCalc(v: any): ToolResult[] {
    const stdHours   = Math.max(1, this.n(v.fullTimeHours) || 40);
    const ptCount    = this.n(v.partTimeCount);
    const ptHours    = this.n(v.avgPartTimeHrs);
    const ftCount    = this.n(v.fullTimeCount);

    const ptFTE      = (ptCount * ptHours) / stdHours;
    const totalFTE   = ftCount + ptFTE;
    const totalHeadcount = ftCount + ptCount;

    return [
      { label: 'Total FTE', value: this.fix2(totalFTE), highlight: true },
      { label: 'Full-Time FTE', value: ftCount.toFixed(1) },
      { label: 'Part-Time FTE Equivalent', value: this.fix2(ptFTE) },
      { label: 'Total Headcount', value: totalHeadcount.toFixed(0), unit: 'people' },
      { label: 'ACA Threshold Status', value: totalFTE >= 50 ? 'ALE (≥ 50 FTE) — ACA applies' : `Non-ALE (${this.fix1(totalFTE)} FTE < 50)`, description: 'Applicable Large Employer threshold (US)' }
    ];
  }

  private utilizationRate(v: any): ToolResult[] {
    const billable  = this.n(v.billableHours);
    const available = Math.max(1, this.n(v.availableHours));
    const rate      = (billable / available) * 100;
    const nonBill   = available - billable;

    return [
      { label: 'Utilization Rate', value: this.pct(rate), unit: '%', highlight: true, isError: rate < 60 },
      { label: 'Billable Hours', value: this.fix1(billable), unit: 'hrs' },
      { label: 'Non-Billable Hours', value: this.fix1(nonBill), unit: 'hrs' },
      { label: 'Benchmark', value: rate >= 75 ? 'Healthy (≥ 75%)' : rate >= 60 ? 'Acceptable (60–75%)' : 'Low (< 60%)', isError: rate < 60 }
    ];
  }

  private billableHours(v: any): ToolResult[] {
    const hours      = this.n(v.billableHours);
    const rate       = this.n(v.hourlyRate);
    const overhead   = this.n(v.overheadPct);
    const writeOff   = this.n(v.writeOffPct);

    const grossRevenue  = hours * rate;
    const afterOverhead = grossRevenue * (1 - overhead / 100);
    const netRevenue    = afterOverhead * (1 - writeOff / 100);
    const overheadCost  = grossRevenue - afterOverhead;
    const writeOffAmt   = afterOverhead - netRevenue;

    return [
      { label: 'Net Realized Revenue', value: this.money(netRevenue), unit: '$', highlight: true },
      { label: 'Gross Revenue', value: this.money(grossRevenue), unit: '$' },
      { label: 'Overhead Deduction', value: this.money(overheadCost), unit: '$', isError: true },
      { label: 'Write-Off Deduction', value: this.money(writeOffAmt), unit: '$', isError: true },
      { label: 'Effective Rate per Billed Hour', value: this.money(hours > 0 ? netRevenue / hours : 0), unit: '$/hr' }
    ];
  }

  private projectCost(v: any): ToolResult[] {
    const base        = this.n(v.baseCost);
    const marginPct   = this.n(v.marginPct);
    const taxPct      = this.n(v.taxPct);
    const contingPct  = this.n(v.contingencyPct);

    const afterMargin = base * (1 + marginPct / 100);
    const afterTax    = afterMargin * (1 + taxPct / 100);
    const total       = afterTax * (1 + contingPct / 100);

    const marginAmt   = afterMargin - base;
    const taxAmt      = afterTax - afterMargin;
    const contingAmt  = total - afterTax;

    return [
      { label: 'Total Project Cost', value: this.money(total), unit: '$', highlight: true },
      { label: 'Base Cost', value: this.money(base), unit: '$' },
      { label: 'Profit Margin Added', value: this.money(marginAmt), unit: '$' },
      { label: 'Tax Added', value: this.money(taxAmt), unit: '$' },
      { label: 'Contingency Buffer', value: this.money(contingAmt), unit: '$' },
      { label: 'Markup on Base', value: this.pct(((total - base) / base) * 100), unit: '%' }
    ];
  }

  private completionPct(v: any): ToolResult[] {
    const completed = this.n(v.completed);
    const total     = Math.max(1, this.n(v.total));
    const pct       = (completed / total) * 100;
    const remaining = total - completed;

    return [
      { label: 'Completion Percentage', value: this.pct(pct), unit: '%', highlight: true },
      { label: 'Completed', value: completed.toFixed(0), unit: 'units' },
      { label: 'Remaining', value: Math.max(0, remaining).toFixed(0), unit: 'units' },
      { label: 'Status', value: pct >= 100 ? '✓ Complete' : pct >= 75 ? 'On Track' : pct >= 50 ? 'In Progress' : 'Early Stage' }
    ];
  }

  private scheduleVariance(v: any): ToolResult[] {
    const ev  = this.n(v.earnedValue);
    const pv  = Math.max(0.01, this.n(v.plannedValue));
    const sv  = ev - pv;
    const spi = ev / pv;

    return [
      { label: 'Schedule Variance (SV)', value: this.money(sv), unit: '$', highlight: true, isError: sv < 0 },
      { label: 'Schedule Performance Index (SPI)', value: this.fix3(spi), highlight: true, isError: spi < 1 },
      { label: 'Earned Value (EV)', value: this.money(ev), unit: '$' },
      { label: 'Planned Value (PV)', value: this.money(pv), unit: '$' },
      { label: 'Status', value: sv > 0 ? `Ahead of Schedule by ${this.money(sv)}` : sv < 0 ? `Behind Schedule by ${this.money(Math.abs(sv))}` : 'On Schedule', isError: sv < 0 },
      { label: 'SPI Interpretation', value: spi >= 1 ? 'Efficient (SPI ≥ 1)' : 'Inefficient (SPI < 1)', isError: spi < 1 }
    ];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // UTILITY TOOLS
  // ════════════════════════════════════════════════════════════════════════════

  private timeDifference(v: any): ToolResult[] {
    const startStr = `${v.startDate ?? ''}T${v.startTime ?? '00:00'}`;
    const endStr   = `${v.endDate ?? ''}T${v.endTime ?? '00:00'}`;
    const start    = new Date(startStr);
    const end      = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return this.noData('Enter valid start and end dates.');

    const totalMs = end.getTime() - start.getTime();
    if (totalMs < 0) return [{ label: 'Error', value: 'End date must be after start date.', isError: true }];

    const totalSecs  = Math.floor(totalMs / 1000);
    const totalMins  = Math.floor(totalSecs / 60);
    const totalHrs   = Math.floor(totalMins / 60);
    const totalDays  = Math.floor(totalHrs / 24);

    // Breakdown
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const tempDate = new Date(start);
    tempDate.setMonth(tempDate.getMonth() + months);
    if (tempDate > end) months--;
    const remaining = new Date(end.getTime() - new Date(start).setMonth(start.getMonth() + months));
    const days  = remaining.getDate() - 1;
    const hrs   = remaining.getHours();
    const mins  = remaining.getMinutes();

    return [
      { label: 'Duration', value: `${months}mo ${days}d ${hrs}h ${mins}m`, highlight: true },
      { label: 'Total Days', value: totalDays.toLocaleString(), unit: 'days' },
      { label: 'Total Hours', value: totalHrs.toLocaleString(), unit: 'hrs' },
      { label: 'Total Minutes', value: totalMins.toLocaleString(), unit: 'mins' },
      { label: 'Total Seconds', value: totalSecs.toLocaleString(), unit: 'secs' }
    ];
  }

  private unixTimestamp(v: any): ToolResult[] {
    const results: ToolResult[] = [];

    // Epoch → Human
    if (v.epoch && String(v.epoch).trim() !== '') {
      const epoch = +v.epoch;
      const isMs  = epoch > 1e10;
      const ms    = isMs ? epoch : epoch * 1000;
      const d     = new Date(ms);
      if (!isNaN(d.getTime())) {
        results.push(
          { label: 'UTC Date & Time', value: d.toUTCString(), highlight: true },
          { label: 'Local Date & Time', value: d.toLocaleString(), highlight: false },
          { label: 'ISO 8601', value: d.toISOString() },
          { label: 'Precision', value: isMs ? 'Milliseconds' : 'Seconds' }
        );
      }
    }

    // Human → Epoch
    const dateStr = `${v.humanDate ?? ''}T${v.humanTime ?? '00:00'}`;
    if (v.humanDate) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        results.push(
          { label: 'Unix Timestamp (sec)', value: Math.floor(d.getTime() / 1000).toString(), highlight: !v.epoch },
          { label: 'Unix Timestamp (ms)', value: d.getTime().toString() }
        );
      }
    }

    return results.length ? results : this.noData('Enter an epoch timestamp or a date to convert.');
  }

  private isoFormatter(v: any): ToolResult[] {
    const dateStr = `${v.inputDate ?? ''}T${v.inputTime ?? '00:00'}`;
    const d       = new Date(dateStr);
    if (!v.inputDate || isNaN(d.getTime())) return this.noData('Enter a valid date.');

    const tz = v.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Week number (ISO)
    const jan4     = new Date(d.getFullYear(), 0, 4);
    const dayOfYear = Math.round((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
    const weekNum   = Math.ceil(dayOfYear / 7);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // Mon=1, Sun=7

    let localStr = d.toISOString();
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      const parts = formatter.formatToParts(d);
      const p: Record<string, string> = {};
      parts.forEach(pt => p[pt.type] = pt.value);
      const offset = this.getUtcOffset(tz, d);
      localStr = `${p['year']}-${p['month']}-${p['day']}T${p['hour']}:${p['minute']}:${p['second']}${offset}`;
    } catch {}

    return [
      { label: 'Full ISO 8601 (with offset)', value: localStr, highlight: true },
      { label: 'UTC / Z notation', value: d.toISOString() },
      { label: 'Date only', value: d.toISOString().slice(0, 10) },
      { label: 'Week Date', value: `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}-${dayOfWeek}` },
      { label: 'Ordinal Date', value: `${d.getFullYear()}-${String(dayOfYear).padStart(3, '0')}` },
      { label: 'Time only', value: d.toISOString().slice(11, 19) + 'Z' }
    ];
  }

  private gmtTimestamp(): ToolResult[] {
    const now = new Date();
    const zones = [
      'America/New_York', 'America/Los_Angeles', 'Europe/London',
      'Europe/Berlin', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata',
      'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'
    ];

    const results: ToolResult[] = [
      { label: 'Current UTC / GMT Time', value: now.toUTCString(), highlight: true },
      { label: 'Unix Timestamp (sec)',  value: Math.floor(now.getTime() / 1000).toString() },
      { label: 'Unix Timestamp (ms)',   value: now.getTime().toString() },
      { label: 'ISO 8601',              value: now.toISOString() }
    ];

    zones.forEach(tz => {
      try {
        const fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false, timeZoneName: 'short'
        });
        results.push({ label: tz.replace('_', ' '), value: fmt.format(now) });
      } catch {}
    });

    return results;
  }

  private ageCalc(v: any): ToolResult[] {
    if (!v.dob) return this.noData('Enter a date of birth.');
    const dob    = new Date(v.dob);
    const asOf   = v.asOfDate ? new Date(v.asOfDate) : new Date();
    if (isNaN(dob.getTime())) return this.noData('Enter a valid date of birth.');

    let years = asOf.getFullYear() - dob.getFullYear();
    let months = asOf.getMonth() - dob.getMonth();
    let days   = asOf.getDate()  - dob.getDate();

    if (days < 0)   { months--; days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate(); }
    if (months < 0) { years--;  months += 12; }

    const nextBday = new Date(asOf.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday <= asOf) nextBday.setFullYear(asOf.getFullYear() + 1);
    const daysToNextBday = Math.ceil((nextBday.getTime() - asOf.getTime()) / 86400000);

    const totalDays  = Math.floor((asOf.getTime() - dob.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);

    return [
      { label: 'Age', value: `${years} yrs  ${months} mo  ${days} days`, highlight: true },
      { label: 'Years', value: years.toString(), unit: 'years' },
      { label: 'Months', value: months.toString(), unit: 'months' },
      { label: 'Days', value: days.toString(), unit: 'days' },
      { label: 'Total Days Lived', value: totalDays.toLocaleString(), unit: 'days' },
      { label: 'Total Weeks Lived', value: totalWeeks.toLocaleString(), unit: 'weeks' },
      { label: 'Next Birthday In', value: `${daysToNextBday} days`, description: nextBday.toDateString() }
    ];
  }

  private ageDifference(v: any): ToolResult[] {
    if (!v.dob1 || !v.dob2) return this.noData('Enter both dates of birth.');
    const d1   = new Date(v.dob1);
    const d2   = new Date(v.dob2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return this.noData('Enter valid dates.');

    const older  = d1 < d2 ? d1 : d2;
    const younger = d1 < d2 ? d2 : d1;

    let years  = younger.getFullYear() - older.getFullYear();
    let months = younger.getMonth()    - older.getMonth();
    let days   = younger.getDate()     - older.getDate();

    if (days < 0)   { months--; days += new Date(younger.getFullYear(), younger.getMonth(), 0).getDate(); }
    if (months < 0) { years--;  months += 12; }

    const totalDays = Math.abs(Math.floor((d1.getTime() - d2.getTime()) / 86400000));

    return [
      { label: 'Age Difference', value: `${years} yrs  ${months} mo  ${days} days`, highlight: true },
      { label: 'Difference in Years', value: years.toString(), unit: 'years' },
      { label: 'Difference in Months', value: (years * 12 + months).toString(), unit: 'months' },
      { label: 'Difference in Days', value: totalDays.toLocaleString(), unit: 'days' },
      { label: 'Older Date', value: older.toDateString() },
      { label: 'Younger Date', value: younger.toDateString() }
    ];
  }

  private mailtoLink(v: any): ToolResult[] {
    if (!v.to) return this.noData('Enter a recipient email address.');
    const encode = (s: string) => encodeURIComponent(s ?? '').replace(/%20/g, '+');
    const parts: string[] = [];
    if (v.cc)       parts.push(`cc=${encode(v.cc)}`);
    if (v.bcc)      parts.push(`bcc=${encode(v.bcc)}`);
    if (v.subject)  parts.push(`subject=${encode(v.subject)}`);
    if (v.body)     parts.push(`body=${encode(v.body)}`);

    const link = `mailto:${v.to}${parts.length ? '?' + parts.join('&') : ''}`;
    const html  = `<a href="${link}">Send Email</a>`;

    return [
      { label: 'Mailto Link', value: link, highlight: true, description: 'Copy and use this in HTML or share directly.' },
      { label: 'HTML Anchor Tag', value: html },
      { label: 'Character Count', value: link.length.toString(), unit: 'chars' }
    ];
  }

  private calendarLinks(v: any): ToolResult[] {
    if (!v.title || !v.startDate) return this.noData('Enter event title and start date.');

    const encode = encodeURIComponent;
    const fmt = (date: string, time: string) =>
      `${date}T${(time || '00:00').replace(':', '')}00`;

    const start = fmt(v.startDate, v.startTime);
    const end   = fmt(v.endDate || v.startDate, v.endTime);

    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encode(v.title)}&dates=${start}/${end}` +
      `${v.location ? '&location=' + encode(v.location) : ''}` +
      `${v.description ? '&details=' + encode(v.description) : ''}`;

    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
      `&subject=${encode(v.title)}&startdt=${v.startDate}T${v.startTime || '00:00'}&enddt=${(v.endDate || v.startDate)}T${v.endTime || '01:00'}` +
      `${v.location ? '&location=' + encode(v.location) : ''}` +
      `${v.description ? '&body=' + encode(v.description) : ''}`;

    const yahoo = `https://calendar.yahoo.com/?v=60&title=${encode(v.title)}&st=${start}&et=${end}` +
      `${v.location ? '&in_loc=' + encode(v.location) : ''}` +
      `${v.description ? '&desc=' + encode(v.description) : ''}`;

    return [
      { label: 'Google Calendar',    value: google,  highlight: true,  description: 'Click to add to Google Calendar' },
      { label: 'Outlook Web',        value: outlook, highlight: false, description: 'Click to add to Outlook' },
      { label: 'Yahoo Calendar',     value: yahoo,   highlight: false, description: 'Click to add to Yahoo Calendar' },
      { label: '.ICS Download Note', value: 'Use the "Download .ICS" button below for Apple Calendar & Outlook desktop.', description: 'Universal iCalendar format' }
    ];
  }

  private timeZoneConvert(v: any): ToolResult[] {
    if (!v.sourceTime) return this.noData('Enter a source time.');
    const [hh, mm]  = (v.sourceTime || '09:00').split(':').map(Number);
    const sourceZone = v.sourceZone || 'UTC';
    const today      = new Date();
    const dateStr    = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const sourceDate = new Date(`${dateStr}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`);

    const results: ToolResult[] = [
      { label: `Source (${sourceZone})`, value: v.sourceTime, highlight: true }
    ];

    const targets = [v.targetZone1, v.targetZone2, v.targetZone3].filter(Boolean);
    targets.forEach((tz: string) => {
      try {
        const fmt = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
        });
        results.push({ label: tz.replace(/_/g, ' '), value: fmt.format(sourceDate) });
      } catch {
        results.push({ label: tz, value: 'Invalid timezone', isError: true });
      }
    });

    return results;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  private n(val: any): number { return parseFloat(val) || 0; }
  private fix1(n: number): string { return n.toFixed(1); }
  private fix2(n: number): string { return n.toFixed(2); }
  private fix3(n: number): string { return n.toFixed(3); }
  private pct(n: number): string  { return n.toFixed(2); }
  private money(n: number): string { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  private inr(n: number): string   { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  private noData(msg: string): ToolResult[] { return [{ label: 'Awaiting Input', value: msg, isError: false }]; }

  private getUtcOffset(tz: string, d: Date): string {
    try {
      const fmt = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' });
      const parts = fmt.formatToParts(d);
      const offset = parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC';
      return offset.replace('GMT', '') || '+00:00';
    } catch { return '+00:00'; }
  }
}
