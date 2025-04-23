import { db } from "../db";
import { events, users, children, familyMembers, type Event, type InsertEvent } from "@shared/schema";
import { eq, and, gt, lte } from "drizzle-orm";
import { storage } from "../storage";

/**
 * Service pour gérer les opérations liées aux événements
 */
class EventService {
  /**
   * Récupère tous les événements pour une famille et ajoute automatiquement les anniversaires à venir
   * des utilisateurs et enfants pour les 30 prochains jours
   */
  async getFamilyEvents(familyId: number): Promise<Event[]> {
    try {
      // 1. Récupérer les événements manuels de la base de données
      const manualEvents = await db.select()
        .from(events)
        .where(eq(events.familyId, familyId))
        .orderBy(events.date);
      
      // 2. Récupérer les membres de la famille
      const familyMembers = await storage.getFamilyMembers(familyId);
      
      // Dates pour calculer les événements des 30 prochains jours
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      // Tableau pour stocker tous les événements (manuels + anniversaires automatiques)
      const allEvents: Event[] = [...manualEvents];
      
      // 3. Ajouter les anniversaires des utilisateurs membres de la famille
      for (const member of familyMembers) {
        if (member.user && member.user.birthDate) {
          // Créer un événement pour l'anniversaire de l'utilisateur
          const userBirthDate = new Date(member.user.birthDate);
          
          // Créer une date d'anniversaire pour cette année
          const thisYearBirthday = new Date(
            today.getFullYear(),
            userBirthDate.getMonth(),
            userBirthDate.getDate()
          );
          
          // Si l'anniversaire est dans les 30 prochains jours
          if (thisYearBirthday >= today && thisYearBirthday <= thirtyDaysLater) {
            const age = today.getFullYear() - userBirthDate.getFullYear();
            
            allEvents.push({
              id: -1 * member.userId, // ID négatif pour éviter les conflits avec les vrais événements
              familyId,
              title: `יום הולדת ${member.user.username || 'משתמש'}`,
              description: `חוגג/ת ${age} שנים`,
              date: thisYearBirthday,
              type: 'birthday',
              createdAt: new Date()
            });
          }
        }
      }
      
      // 4. Ajouter les anniversaires des enfants des membres de la famille
      for (const member of familyMembers) {
        // Récupérer les enfants de ce membre
        const userChildren = await storage.getUserChildren(member.userId);
        
        for (const child of userChildren) {
          if (child.birthDate) {
            // Créer un événement pour l'anniversaire de l'enfant
            const childBirthDate = new Date(child.birthDate);
            
            // Créer une date d'anniversaire pour cette année
            const thisYearBirthday = new Date(
              today.getFullYear(),
              childBirthDate.getMonth(),
              childBirthDate.getDate()
            );
            
            // Si l'anniversaire est dans les 30 prochains jours
            if (thisYearBirthday >= today && thisYearBirthday <= thirtyDaysLater) {
              const age = today.getFullYear() - childBirthDate.getFullYear();
              
              allEvents.push({
                id: -1000000 - child.id, // ID très négatif pour éviter les conflits
                familyId,
                title: `יום הולדת ${child.name}`,
                description: `חוגג/ת ${age} שנים - ילד/ה של ${member.user?.username || 'משתמש'}`,
                date: thisYearBirthday,
                type: 'child-birthday',
                createdAt: new Date()
              });
            }
          }
        }
      }
      
      // Trier tous les événements par date
      return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    } catch (error) {
      console.error("Error getting family events:", error);
      throw error;
    }
  }
  
  /**
   * Ajoute un événement manuel
   */
  async addEvent(event: InsertEvent): Promise<Event> {
    // Valider que l'utilisateur est membre de la famille?
    
    const [newEvent] = await db.insert(events)
      .values(event)
      .returning();
      
    return newEvent;
  }
}

export const eventService = new EventService();