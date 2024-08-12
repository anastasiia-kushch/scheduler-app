import React, { useCallback, useState } from 'react';
import Paper from '@mui/material/Paper';
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  AppointmentForm,
  Toolbar,
  AppointmentTooltip,
  AllDayPanel,
  ConfirmationDialog,
  ViewSwitcher,
  DateNavigator,
  CurrentTimeIndicator,
  TodayButton,
} from '@devexpress/dx-react-scheduler-material-ui';
import './App.css';

const date = new Date().toISOString().split('T')[0];

function App({ data }) {
  const savedCurrentView = localStorage.getItem('currentView') || 'Week';
  const savedCurrentDate = localStorage.getItem('currentDate') || date;
  const [currentView, setCurrentView] = useState(savedCurrentView);
  const [currentDate, setCurrentDate] = useState(savedCurrentDate);
  const [appointments, setAppointments] = useState(data);

  const handleViewChange = (viewName) => {
    setCurrentView(viewName);
    localStorage.setItem('currentView', viewName);
  };

  const handleDateChange = (date) => {
    setCurrentDate(date);
    localStorage.setItem('currentDate', date);
  };

  const commitChanges = useCallback(({ added, changed, deleted }) => {
    setAppointments((prevData) => {
      let newData = prevData;

      if (added) {
        const newId =
          newData.length > 0 ? newData[newData.length - 1].id + 1 : 0;

        newData = [...newData, { ...added, id: newId }];
      }

      if (changed) {
        newData = newData.map((appointment) =>
          changed[appointment.id]
            ? { ...appointment, ...changed[appointment.id] }
            : appointment
        );
      }

      if (deleted !== undefined) {
        newData = newData.filter((appointment) => appointment.id !== deleted);
      }

      return newData;
    });
  }, []);

  const messages = {
    allDayPanel: {
      allDay: 'Cały dzień',
    },
    todayButton: {
      today: 'Dzisiaj',
    },
  };

  return (
    <Paper>
      <Scheduler data={appointments} locale="pl-PL">
        <ViewState
          defaultCurrentDate={currentDate}
          currentViewName={currentView}
          onCurrentViewNameChange={handleViewChange}
          onCurrentDateChange={handleDateChange}
        />
        <EditingState onCommitChanges={commitChanges} />
        <IntegratedEditing />
        <Toolbar />
        <TodayButton messages={messages.todayButton} />
        <DayView startDayHour={9} endDayHour={21} />
        <WeekView startDayHour={9} endDayHour={21} />
        <MonthView />
        <AllDayPanel messages={messages.allDayPanel} />
        <DateNavigator />
        <ViewSwitcher currentView={currentView} onChange={handleViewChange} />
        <Appointments />
        <AppointmentTooltip showOpenButton showDeleteButton showCloseButton />
        <AppointmentForm />
        <ConfirmationDialog />
        <CurrentTimeIndicator shadePreviousCells shadePreviousAppointments />
      </Scheduler>
    </Paper>
  );
}

export default App;
