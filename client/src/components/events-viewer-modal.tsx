import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Event, FamilyMember, User } from "@shared/schema";
import { X, Plus, Calendar } from "lucide-react";

interface EventsViewerModalProps {
  events: Event[];
  members?: (FamilyMember & { user?: User })[];
  familyId: number;
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: () => void;
}

export default function EventsViewerModal({ 
  events, 
  members, 
  familyId, 
  isOpen, 
  onClose,
  onAddEvent 
}: EventsViewerModalProps) {
  if (!isOpen) return null;
  
  // Organiser les événements par mois
  const eventsByMonth: Record<string, Event[]> = {};
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const monthYear = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
    if (!eventsByMonth[monthYear]) {
      eventsByMonth[monthYear] = [];
    }
    eventsByMonth[monthYear].push(event);
  });
  
  // Trier les clés des mois
  const sortedMonths = Object.keys(eventsByMonth).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearA !== yearB ? yearA - yearB : monthA - monthB;
  });
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="p-4 flex justify-between items-center border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">אירועים קרובים</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={onAddEvent}
            >
              <Plus className="h-4 w-4" />
              הוסף אירוע
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {sortedMonths.length > 0 ? (
            sortedMonths.map(monthKey => {
              const [year, month] = monthKey.split('-').map(Number);
              const monthName = new Date(year, month).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
              
              return (
                <div key={monthKey} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">{monthName}</h3>
                  <div className="space-y-4">
                    {eventsByMonth[monthKey].map(event => {
                      const eventDate = new Date(event.date);
                      const day = eventDate.getDate();
                      const weekday = eventDate.toLocaleDateString('he-IL', { weekday: 'long' });
                      
                      // Trouver l'utilisateur pour les anniversaires
                      let userInfo = null;
                      if (event.type === 'birthday' && event.id < 0) {
                        const userId = Math.abs(event.id);
                        const member = members?.find(m => m.userId === userId);
                        if (member?.user) {
                          userInfo = member.user;
                        }
                      } else if (event.type === 'child-birthday' && event.id < -1000000) {
                        // Pour les anniversaires d'enfants, l'information est dans la description
                      }
                      
                      return (
                        <div key={event.id} className="flex gap-4">
                          <div className="bg-blue-100 h-14 w-14 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-primary font-bold">{day}</span>
                            <span className="text-primary text-xs">{weekday}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {event.type?.includes('birthday') && userInfo && (
                                <div className="h-6 w-6 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white">
                                  {userInfo.profileImage ? (
                                    <img 
                                      src={userInfo.profileImage} 
                                      alt={userInfo.username || "משתמש"} 
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="font-bold text-xs">
                                      {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : "מ"}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="font-medium">{event.title}</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">אין אירועים מתוכננים</p>
              <Button onClick={onAddEvent}>הוסף אירוע חדש</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}