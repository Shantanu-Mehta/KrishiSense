import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './home/Home';
import AddCrop from './home/AddCrop.jsx';
import PreviousReport from './home/PreviousReport.jsx';
import DeviceStatus from './home/DeviceStatus.jsx';
import Alerts from './home/Alerts.jsx';
import IrrigationSchedule from './home/IrrigationSchedule.jsx';
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-field" element={<AddCrop />} />
        <Route path="/schedules/:planId?" element={<IrrigationSchedule />} />
        <Route path="/history" element={<PreviousReport />} />
        <Route path="/device-status" element={<DeviceStatus />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
