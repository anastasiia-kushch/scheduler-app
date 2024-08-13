import React, { useCallback, useEffect, useState } from 'react';
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
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore/lite';
import moment from 'moment';
import toast, { Toaster } from 'react-hot-toast';

const date = new Date().toISOString().split('T')[0];

function App({ data }) {
  const savedCurrentView = localStorage.getItem('currentView') || 'Week';
  const savedCurrentDate = localStorage.getItem('currentDate') || date;
  const [currentView, setCurrentView] = useState(savedCurrentView);
  const [currentDate, setCurrentDate] = useState(savedCurrentDate);
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = async () => {
    try {
      const appointmentsCol = collection(data, 'appointments');
      const appointmentSnapshot = await getDocs(appointmentsCol);
      const appointmentList = appointmentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(appointmentList);
    } catch (error) {
      toast.error('Błąd pobierania wydarzeń');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [data]);

  const handleViewChange = (viewName) => {
    setCurrentView(viewName);
    localStorage.setItem('currentView', viewName);
  };

  const handleDateChange = (date) => {
    setCurrentDate(date);
    localStorage.setItem('currentDate', date);
  };

  const commitChanges = useCallback(
    async ({ added, changed, deleted }) => {
      let newData = appointments;

      if (added) {
        console.log(added);

        try {
          const startDate = moment(
            added.startDate,
            'MMMM D, YYYY at h:mm:ss A Z'
          ).format('YYYY-MM-DDTHH:mm');
          const endDate = moment(
            added.endDate,
            'MMMM D, YYYY at h:mm:ss A Z'
          ).format('YYYY-MM-DDTHH:mm');

          const newDoc = await addDoc(collection(data, 'appointments'), {
            ...added,
            startDate,
            endDate,
          });

          newData = [...newData, { ...added, id: newDoc.id }];
          toast.success('Wydarzenie dodane!');
        } catch (error) {
          toast.error('Błąd dodawania wydarzenia');
        }
      }

      if (changed) {
        try {
          await Promise.all(
            Object.keys(changed).map(async (id) => {
              const appointmentChanges = changed[id];

              const updatedFields = { ...appointmentChanges };
              if (appointmentChanges.startDate) {
                updatedFields.startDate = moment(
                  appointmentChanges.startDate,
                  'MMMM D, YYYY at h:mm:ss A Z'
                ).format('YYYY-MM-DDTHH:mm');
              }

              if (appointmentChanges.endDate) {
                updatedFields.endDate = moment(
                  appointmentChanges.endDate,
                  'MMMM D, YYYY at h:mm:ss A Z'
                ).format('YYYY-MM-DDTHH:mm');
              }

              const appointmentRef = doc(data, 'appointments', id);
              await updateDoc(appointmentRef, updatedFields);

              newData = newData.map((appointment) =>
                appointment.id === id
                  ? { ...appointment, ...updatedFields }
                  : appointment
              );
            })
          );
          toast('Wydarzenie zaktualizowane!', {
            icon: '✍️',
          });
        } catch (error) {
          toast.error('Błąd aktualizacji wydarzenia');
        }
      }

      if (deleted !== undefined) {
        try {
          const appointmentRef = doc(data, 'appointments', deleted);
          await deleteDoc(appointmentRef);

          newData = newData.filter((appointment) => appointment.id !== deleted);
          toast('Wydarzenie usunięte!', {
            icon: '🗑',
          });
        } catch (error) {
          toast.error('Błąd usuwania wydarzenia');
        }
      }

      setAppointments(newData);
    },
    [appointments, data]
  );

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
        <Toaster />
      </Scheduler>
    </Paper>
  );
}

export default App;
