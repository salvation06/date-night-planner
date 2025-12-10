// ItineraryBuilderAgent - Builds timelines and itineraries
import { AgentResponse, Restaurant, Activity, TimelineBlock, Itinerary, BuildItineraryTask } from './types.ts';

export class ItineraryBuilderAgent {
  private agentId = 'itinerary-builder-agent';

  async execute(task: BuildItineraryTask, userId: string): Promise<AgentResponse<Omit<Itinerary, 'id'>>> {
    console.log(`[${this.agentId}] Executing build task:`, task);

    try {
      const { restaurant, activities, time, dateLabel } = task;

      // Determine meal type based on time
      const { mealType, beforeLabel, afterLabel } = this.getMealLabels(time);

      // Build timeline blocks
      const timelineBlocks = this.buildTimeline(
        restaurant, 
        activities, 
        time, 
        beforeLabel, 
        afterLabel
      );

      // Calculate cost estimate
      const costEstimate = this.calculateCostEstimate(restaurant, activities);

      // Generate headline
      const headline = `${restaurant.cuisine || 'Date'} Night`;

      const itinerary: Omit<Itinerary, 'id'> = {
        user_id: userId,
        date_label: dateLabel || new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        headline,
        restaurant,
        activities,
        timeline_blocks: timelineBlocks,
        cost_estimate: costEstimate,
        status: 'upcoming',
      };

      console.log(`[${this.agentId}] Built itinerary with ${timelineBlocks.length} timeline blocks`);
      return { success: true, data: itinerary };

    } catch (error) {
      console.error(`[${this.agentId}] Error:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private getMealLabels(time: string): { mealType: string; beforeLabel: string; afterLabel: string } {
    const timeHour = parseInt(time.split(':')[0]);
    const isPM = time.includes('PM');
    const hour24 = isPM && timeHour !== 12 ? timeHour + 12 : timeHour;
    
    if (hour24 < 11) {
      return { mealType: 'Breakfast', beforeLabel: 'Before Breakfast', afterLabel: 'After Breakfast' };
    } else if (hour24 < 14) {
      return { mealType: 'Brunch', beforeLabel: 'Before Brunch', afterLabel: 'After Brunch' };
    } else if (hour24 < 17) {
      return { mealType: 'Lunch', beforeLabel: 'Before Lunch', afterLabel: 'After Lunch' };
    }
    return { mealType: 'Dinner', beforeLabel: 'Before Dinner', afterLabel: 'After Dinner' };
  }

  private buildTimeline(
    restaurant: Restaurant,
    activities: Activity[],
    time: string,
    beforeLabel: string,
    afterLabel: string
  ): TimelineBlock[] {
    const timelineBlocks: TimelineBlock[] = [];

    // Add before meal activities
    const beforeActivities = activities.filter(a => a.time_window === 'before');
    beforeActivities.forEach((a, index) => {
      const minutesBefore = (beforeActivities.length - index) * 60 + 30;
      timelineBlocks.push({
        time: this.calculateTimeOffset(time, -minutesBefore),
        icon: a.icon || '📍',
        title: a.name,
        subtitle: `${a.category} · ${beforeLabel}`,
        hasLocation: true,
        address: a.address,
      });
    });

    // Add the restaurant/meal
    timelineBlocks.push({
      time,
      icon: '🍽️',
      title: restaurant.name,
      subtitle: `${restaurant.cuisine || 'Restaurant'} · ${restaurant.price || '$$'}`,
      extra: restaurant.address,
      hasLocation: true,
    });

    // Add after meal activities  
    const afterActivities = activities.filter(a => a.time_window === 'after');
    afterActivities.forEach((a, index) => {
      const minutesAfter = 90 + (index * 60);
      timelineBlocks.push({
        time: this.calculateTimeOffset(time, minutesAfter),
        icon: a.icon || '📍',
        title: a.name,
        subtitle: `${a.category} · ${afterLabel}`,
        hasLocation: true,
        address: a.address,
      });
    });

    return timelineBlocks;
  }

  private calculateTimeOffset(baseTime: string, offsetMinutes: number): string {
    const [timePart, period] = baseTime.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    
    totalMinutes += offsetMinutes;
    
    // Handle day wraparound
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    
    let newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';
    if (newHours > 12) newHours -= 12;
    if (newHours === 0) newHours = 12;
    
    return `${newHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  }

  private calculateCostEstimate(restaurant: Restaurant, activities: Activity[]): string {
    const priceMap: Record<string, number> = { '$': 30, '$$': 60, '$$$': 100, '$$$$': 150 };
    const dinnerCost = priceMap[restaurant.price || '$$'] || 60;
    const activityCost = activities.length * 25;
    const totalMin = (dinnerCost + activityCost) * 0.8;
    const totalMax = (dinnerCost + activityCost) * 1.2;
    return `$${Math.round(totalMin)}-${Math.round(totalMax)}`;
  }
}

export const itineraryBuilderAgent = new ItineraryBuilderAgent();
