import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts'
import type { ChartDataPoint, ComparisonDataPoint, DailyEvolution } from '../services/statisticsService'
import { formatCOP } from '../utils/currency'

interface Props {
  distribution: ChartDataPoint[]
  evolution: DailyEvolution[]
  comparison: ComparisonDataPoint[]
}

const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, marginTop: '0.5rem', fontSize: '0.875rem' }
const thStyle = { borderBottom: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'left' as const }
const tdStyle = { borderBottom: '1px solid var(--color-border)', padding: '0.5rem' }
const detailsStyle = { marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-primary)' }

export default function DashboardCharts({ distribution, evolution, comparison }: Props) {
  const distTotal = distribution.reduce((sum, d) => sum + d.value, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Distribución por Categoría */}
      <section>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Distribución por Categoría</h3>
        {distribution.length > 0 ? (
          <>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#cccccc'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => formatCOP(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <details style={detailsStyle}>
              <summary>Ver datos de distribución</summary>
              <table style={tableStyle}>
                <thead>
                  <tr><th style={thStyle}>Categoría</th><th style={thStyle}>Monto</th><th style={thStyle}>%</th></tr>
                </thead>
                <tbody>
                  {distribution.map(d => (
                    <tr key={d.name}>
                      <td style={tdStyle}>{d.name}</td>
                      <td style={tdStyle}>{formatCOP(d.value)}</td>
                      <td style={tdStyle}>{distTotal > 0 ? Math.round((d.value / distTotal) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin datos de distribución.</p>
        )}
      </section>

      {/* Evolución por Día */}
      <section>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Evolución Diaria</h3>
        {evolution.length > 0 && evolution.some(e => e.amount > 0) ? (
          <>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.substring(8, 10)} // only day
                    tick={{ fontSize: 12 }} 
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${(val / 1000)}k`} 
                    tick={{ fontSize: 12 }} 
                    width={60}
                  />
                  <Tooltip 
                    formatter={(val: unknown) => formatCOP(Number(val))} 
                    labelFormatter={(label: unknown) => `Día ${String(label).substring(8, 10)}`}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details style={detailsStyle}>
              <summary>Ver datos de evolución</summary>
              <table style={tableStyle}>
                <thead>
                  <tr><th style={thStyle}>Día</th><th style={thStyle}>Monto</th></tr>
                </thead>
                <tbody>
                  {evolution.map(e => (
                    <tr key={e.date}>
                      <td style={tdStyle}>{e.date}</td>
                      <td style={tdStyle}>{formatCOP(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin gastos registrados este mes.</p>
        )}
      </section>

      {/* Comparación de Categorías */}
      <section>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Comparación y Límites</h3>
        {comparison.length > 0 ? (
          <>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(val) => `$${(val / 1000)}k`} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip 
                    formatter={(val: unknown, name: unknown) => [formatCOP(Number(val)), String(name) === 'value' ? 'Gastado' : 'Límite']} 
                  />
                  <Bar dataKey="value" name="Gastado" radius={[0, 4, 4, 0]}>
                    {comparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-primary)'} />
                    ))}
                  </Bar>
                  {/* Overlay limits if they exist. We use a secondary bar or maybe a scatter line, but for simplicity, another bar */}
                  <Bar dataKey="limit" name="Límite" fill="var(--color-text-muted)" opacity={0.3} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details style={detailsStyle}>
              <summary>Ver datos de comparación</summary>
              <table style={tableStyle}>
                <thead>
                  <tr><th style={thStyle}>Categoría</th><th style={thStyle}>Gastado</th><th style={thStyle}>Límite</th></tr>
                </thead>
                <tbody>
                  {comparison.map(c => (
                    <tr key={c.name}>
                      <td style={tdStyle}>{c.name}</td>
                      <td style={tdStyle}>{formatCOP(c.value)}</td>
                      <td style={tdStyle}>{c.limit ? formatCOP(c.limit) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay categorías activas con gastos o presupuestos.</p>
        )}
      </section>

    </div>
  )
}
