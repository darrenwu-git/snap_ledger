import React from 'react';
import { useLedger } from '../context/LedgerContext';

const MonthlySummary: React.FC = () => {
  const { transactions } = useLedger();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  // Calculate category breakdown
  const categoryTotals = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([id, total]) => {
      const category = useLedger().categories.find(c => c.id === id);
      return {
        ...category,
        total,
        percentage: expense > 0 ? (total / expense) * 100 : 0
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
        Current Balance
      </h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '24px' }}>
        ${balance.toLocaleString()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: 'hsl(var(--color-bg))', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--color-income))' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>Income</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--color-income))' }}>
            +${income.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '16px', background: 'hsl(var(--color-bg))', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--color-expense))' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))' }}>Expense</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--color-expense))' }}>
            -${expense.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      {expense > 0 && (
        <div className="animate-fade-in">
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', borderTop: '1px solid hsl(var(--color-border))', paddingTop: '16px' }}>Spending Analysis</h4>
          <div className="flex-col" style={{ gap: '12px' }}>
            {categoryBreakdown.map((item) => (
              <div key={item.id || 'unknown'} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item.icon || '📦'}</span>
                    <span style={{ fontSize: '0.9rem' }}>{item.name || 'Unknown'}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    ${item.total.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', fontWeight: 400 }}>({Math.round(item.percentage)}%)</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'hsl(var(--color-bg))', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${item.percentage}%`,
                    height: '100%',
                    background: 'hsl(var(--color-expense))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease-out'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;
