import React, { useMemo } from 'react';
import { useLedger } from '../context/LedgerContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MonthlySummaryProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: 'month' | 'year';
  setViewMode: (mode: 'month' | 'year') => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode
}) => {
  const { transactions, categories } = useLedger();

  // Helper to format date display
  const dateDisplay = useMemo(() => {
    if (viewMode === 'year') {
      return currentDate.getFullYear().toString();
    }
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentDate, viewMode]);

  // Navigation Handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (viewMode === 'year') {
        return tDate.getFullYear() === year;
      } else {
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      }
    });
  }, [transactions, currentDate, viewMode]);

  const { expense, balance } = useMemo(() => {
    const inc = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const exp = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { expense: exp, balance: inc - exp };
  }, [filteredTransactions]);

  // Category Breakdown for Chart
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
      });

    return Object.entries(totals)
      .map(([id, total]) => {
        const cat = categories.find(c => c.id === id);
        return {
          id,
          name: cat?.name || 'Unknown',
          value: total
        };
      })
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
      }));
  }, [filteredTransactions, categories]);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--color-bg))', borderRadius: 'var(--radius-full)', padding: '4px' }}>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              background: viewMode === 'month' ? 'hsl(var(--color-surface))' : 'transparent',
              boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'month' ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--color-text-main))'
            }}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('year')}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              background: viewMode === 'year' ? 'hsl(var(--color-surface))' : 'transparent',
              boxShadow: viewMode === 'year' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'year' ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--color-text-main))'
            }}
          >
            Year
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handlePrev} style={{ fontSize: '1.2rem', padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--color-text-main))' }}>‹</button>
          <span style={{ fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>{dateDisplay}</span>
          <button onClick={handleNext} style={{ fontSize: '1.2rem', padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--color-text-main))' }}>›</button>
        </div>
      </div>

      {/* Chart Section with Centered Info */}
      {expense > 0 ? (
        <div style={{ height: '300px', width: '100%', marginBottom: '24px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={85}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `$${value.toLocaleString()}`}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: '#333'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Info Overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            textAlign: 'center',
            width: '160px', // Constrain width to fit in circle
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
              Total Expense
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(var(--color-text-main))', lineHeight: '1.2' }}>
              ${expense.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: balance >= 0 ? 'hsl(var(--color-income))' : 'hsl(var(--color-text-muted))', marginTop: '4px', fontWeight: 500 }}>
              {balance >= 0 ? 'saved ' : 'over '}${Math.abs(balance).toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--color-text-muted))', border: '2px dashed hsl(var(--color-border))', borderRadius: '16px', marginBottom: '24px' }}>
          No expenses for this period
          </div>
      )}


      {/* Breakdown List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categoryData.slice(0, 5).map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: item.fill }}></div>
              <span style={{ fontSize: '0.9rem', color: 'hsl(var(--color-text-main))' }}>{item.name}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--color-text-main))' }}>
              ${item.value.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', fontWeight: 400 }}>({Math.round((item.value / expense) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlySummary;
