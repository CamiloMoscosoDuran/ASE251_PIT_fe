import { Component } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-clima-alertas',
  imports: [NgClass],
  templateUrl: './clima-alertas.html',
  styleUrl: './clima-alertas.scss'
})
export class ClimaAlertasComponent {
  forecast = [
    { id: 1, label: 'Hoy', icon: '☀️', max: 28, min: 16, isToday: true },
    { id: 2, label: 'Mañana', icon: '⛅', max: 26, min: 14, isToday: false },
    { id: 3, label: 'Jue', icon: '🌥️', max: 24, min: 12, isToday: false },
    { id: 4, label: 'Vie', icon: '🌧️', max: 22, min: 10, isToday: false },
    { id: 5, label: 'Sáb', icon: '☀️', max: 25, min: 13, isToday: false },
    { id: 6, label: 'Dom', icon: '☀️', max: 27, min: 15, isToday: false },
    { id: 7, label: 'Lun', icon: '🌡️', max: 33, min: 8, isToday: false },
  ];

  alertas = [
    {
      id: 1,
      type: 'warning',
      icon: '⚠️',
      title: 'Riesgo de helada leve',
      crop: 'Uva',
      description: 'Temperatura mínima proyectada: 8°C. Proteger los brotes jóvenes de uva con cobertura nocturna.',
      time: 'Próxima semana'
    },
    {
      id: 2,
      type: 'info',
      icon: 'ℹ️',
      title: 'Período óptimo de riego',
      crop: 'Papaya',
      description: 'Las condiciones de humedad son favorables. Se recomienda riego ligero cada 3 días para Papaya.',
      time: 'Esta semana'
    },
    {
      id: 3,
      type: 'success',
      icon: '✅',
      title: 'Condiciones ideales de cosecha',
      crop: 'Palta',
      description: 'Temperatura y humedad óptimas para proceder con la cosecha de Palta en los próximos 60 días.',
      time: 'En 60 días'
    },
    {
      id: 4,
      type: 'danger',
      icon: '⚠️',
      title: 'Vientos fuertes esperados',
      crop: 'General',
      description: 'Vientos de hasta 45 km/h previstos. Asegurar estructuras de soporte y coberturas temporales.',
      time: 'Mañana'
    }
  ];

  cultivosClima = [
    {
      nombre: 'Papaya',
      icon: '🌸',
      condicion: 'Condiciones ideales',
      condicionClass: 'ideal',
      tempIdeal: '22–30°C',
      tempActual: '28°C',
      humedadIdeal: '60–70%',
      humedadActual: '65%'
    },
    {
      nombre: 'Uva',
      icon: '🍇',
      condicion: 'Temperatura alta',
      condicionClass: 'alta',
      tempIdeal: '15–25°C',
      tempActual: '28°C',
      humedadIdeal: '50–60%',
      humedadActual: '65%'
    },
    {
      nombre: 'Palta',
      icon: '🥑',
      condicion: 'Condiciones ideales',
      condicionClass: 'ideal',
      tempIdeal: '20–28°C',
      tempActual: '28°C',
      humedadIdeal: '55–65%',
      humedadActual: '65%'
    }
  ];
}
