export type BookingSection = {
  booking: {
    title: string
    step1: string
    step2: string
    step3: string
    step4: string
    noServices: string
    loadingSlots: string
    noSlots: string
    notesPlaceholder: string
    summary: string
    summaryService: string
    summaryDate: string
    summaryTime: string
    summaryInsurance: string
    summaryInsuranceNumber: string
    submitting: string
    confirm: string
    errorLoadSlots: string
    errorRequired: string
    successBooked: string
    errorBooking: string
    selfBookingError: string
    slotUnavailable: string
    slotInPast: string
    slotTooShort: string
    dateFormat: string
    morning: string
    afternoon: string
    priceOnRequest: string
  }
}

export const bookingPt: BookingSection = {
  booking: {
    title: "Agendar Consulta",
    step1: "1. Escolha o servi\u00e7o",
    step2: "2. Escolha a data",
    step3: "3. Escolha o hor\u00e1rio",
    step4: "4. Observa\u00e7\u00f5es (opcional)",
    noServices: "Nenhum servi\u00e7o dispon\u00edvel.",
    loadingSlots: "A carregar hor\u00e1rios...",
    noSlots: "Nenhum hor\u00e1rio dispon\u00edvel nesta data.",
    notesPlaceholder: "Descreva brevemente o motivo da consulta...",
    summary: "Resumo",
    summaryService: "Servi\u00e7o:",
    summaryDate: "Data:",
    summaryTime: "Hor\u00e1rio:",
    summaryInsurance: "Seguro:",
    summaryInsuranceNumber: "N.\u00b0 seguro:",
    submitting: "A agendar...",
    confirm: "Confirmar Agendamento",
    errorLoadSlots: "Erro ao carregar hor\u00e1rios dispon\u00edveis.",
    errorRequired: "Por favor, preencha todos os campos obrigat\u00f3rios.",
    successBooked: "Pedido de consulta enviado!",
    errorBooking: "Erro ao agendar consulta. Tente novamente.",
    selfBookingError: "N\u00e3o \u00e9 poss\u00edvel agendar uma consulta consigo mesmo.",
    slotUnavailable: "Este hor\u00e1rio j\u00e1 n\u00e3o est\u00e1 dispon\u00edvel. Por favor, escolha outro.",
    slotInPast: "Este hor\u00e1rio j\u00e1 passou. Por favor, escolha outro.",
    slotTooShort: "O hor\u00e1rio selecionado n\u00e3o tem dura\u00e7\u00e3o suficiente para este servi\u00e7o. Por favor, escolha outro.",
    dateFormat: "d 'de' MMMM 'de' yyyy",
    morning: "Manh\u00e3",
    afternoon: "Tarde",
    priceOnRequest: "Pre\u00e7o sob consulta",
  },
}
