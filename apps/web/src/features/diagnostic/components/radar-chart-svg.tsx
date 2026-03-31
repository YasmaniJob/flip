import { Svg, Circle, Line, Polygon, Text as SvgText, G } from '@react-pdf/renderer';

interface RadarChartSVGProps {
  data: Array<{ category: string; score: number }>;
  size?: number;
}

/**
 * Divide el texto en varias líneas si excede el máximo de caracteres
 */
function splitTextIntoLines(text: string, maxCharsPerLine: number = 22): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine === '' ? '' : ' ') + word;
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

export function RadarChartSVG({ data, size = 300 }: RadarChartSVGProps) {
  // Aumentamos el ancho total del lienzo para que las etiquetas horizontales quepan
  const width = size * 1.6; // Aún más ancho para mayor seguridad
  const height = size;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = height * 0.22; 
  const numPoints = data.length;
  const angleStep = (2 * Math.PI) / numPoints;

  const dataPoints = data.map((item, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = Math.max(5, (item.score / 100) * maxRadius); // Mínimo para que no colapse el punto
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, angle };
  });

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid circular */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, i) => (
        <Circle
          key={`grid-${i}`}
          cx={centerX}
          cy={centerY}
          r={maxRadius * level}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeOpacity={0.8}
          fill="none"
        />
      ))}

      {/* Líneas radiales */}
      {data.map((_, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const endX = centerX + maxRadius * Math.cos(angle);
        const endY = centerY + maxRadius * Math.sin(angle);
        return (
          <Line
            key={`radial-${index}`}
            x1={centerX}
            y1={centerY}
            x2={endX}
            y2={endY}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      <Polygon
        points={polygonPoints}
        fill="rgba(59, 130, 246, 0.35)"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {dataPoints.map((p, index) => (
        <Circle
          key={`point-${index}`}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="1"
        />
      ))}

      {/* Etiquetas Multilínea con mejor posicionamiento */}
      {data.map((item, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const isCenter = Math.abs(Math.cos(angle)) < 0.1;
        const isLeft = Math.cos(angle) < -0.1;
        const isRight = Math.cos(angle) > 0.1;
        
        // Ajustar distancia del texto según si está arriba/abajo o a los lados
        const labelRadius = maxRadius + (isCenter ? 25 : 15);
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        
        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (isLeft) textAnchor = 'end';
        if (isRight) textAnchor = 'start';
        
        const lines = splitTextIntoLines(item.category, 22);
        
        return (
          <G key={`label-g-${index}`}>
            {lines.map((line, lineIdx) => {
              const lineHeight = 9;
              const totalHeight = lines.length * lineHeight;
              const yOffset = (lineIdx * lineHeight) - (totalHeight / 2);
              
              return (
                <SvgText
                  key={`label-text-${index}-${lineIdx}`}
                  x={x}
                  y={y + yOffset}
                  style={{
                    fontSize: 8,
                    fontWeight: 'bold',
                    fill: '#334155',
                  }}
                  textAnchor={textAnchor}
                >
                  {line}
                </SvgText>
              );
            })}
          </G>
        );
      })}

      {[20, 40, 60, 80, 100].map((value, i) => (
        <SvgText
          key={`percent-${i}`}
          x={centerX + 4}
          y={centerY - maxRadius * (value / 100) + 3}
          style={{
            fontSize: 6,
            fill: '#64748b',
            opacity: 0.7,
          }}
        >
          {value}%
        </SvgText>
      ))}
    </Svg>
  );
}
