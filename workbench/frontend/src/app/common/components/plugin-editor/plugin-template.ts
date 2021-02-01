import * as moment from 'moment';

export const pluginTemplate = `
// version: 0.0.0 
// created: ${moment().format('YYYY-MM-DD HH:mm')}
// maintainer: <firstname>.<lastname>@sap.com

import java.util.List;
import java.util.ArrayList;

import net.coresystems.autoscheduler.domain.interfaces.*;
import net.coresystems.autoscheduler.service.spatial.EuclideanDistanceService;

import java.util.stream.Collectors;

import com.sap.fsm.optimization.v1.LoggingService;
import com.sap.fsm.optimization.v1.TravelService;
import com.sap.fsm.optimization.v1.JobUtils;


public class SkillsAndDistance implements IOptimizationPlugin {

    public static long MAX_DRIVING_MINUTES = 360L;

    public static int TWENTY_FOUR_HOURS_IN_MINUTES = 1440;

    public Long score(IResource resource, IJob job, IAssignment assignment, ILocation location) {
        List<String> resourceSkills = resource.getSkills();
        List<String> jobRequirements = job.getRequirements();
        List<String> matchingSkills = jobRequirements.stream().filter(elem -> resourceSkills.contains(elem))
                .collect(Collectors.toList());
        List<String> missingSkills = jobRequirements.stream().filter(elem -> !resourceSkills.contains(elem))
                .collect(Collectors.toList());

        if (matchingSkills == null || jobRequirements == null || matchingSkills.size() != jobRequirements.size()) {
            LoggingService.logScore(job, resource, -1L,
                    "Technician does not have the following mandatory skills: " + missingSkills);
            return -1L;
        } else if (job.getResourceBlackList() != null && job.getResourceBlackList().contains(resource.getFSMId())) {
            LoggingService.logScore(job, resource, -1L, "Technician is blacklisted for this job.");
            return -1L;
        } else if (job.getLocation() == null) {
            LoggingService.logScore(job, resource, -1L, "Job location is not valid");
            return -1L;
        } else if (job.getDeadline() != null && assignment.getEndDate().after(JobUtils.latestEndDatePossible(job, TWENTY_FOUR_HOURS_IN_MINUTES))) {
            LoggingService.logScore(job, resource, -1L, "Assignment ends too late (over 24 hours from now and over 24 hours after the job deadline");
            return -1L;
        } else {
            String scoreMessage = "Scoring by travel time :: ";
            Integer durationInMinutes;

            if (assignment.getTripTo() != null && assignment.getTripTo().getDurationInMinutes() != null) {
                durationInMinutes = assignment.getTripTo().getDurationInMinutes();
                scoreMessage += " - travel time  from last task or booking: " + durationInMinutes + " minutes ::";
            } else {
                durationInMinutes = TravelService.calculateDurationInMinutes(resource.getLocation(), job.getLocation());
                scoreMessage += " - travel time from default address of the technician: " + durationInMinutes + " minutes::";
            }

            if (durationInMinutes != null) {
                Long score = (MAX_DRIVING_MINUTES - durationInMinutes);
                LoggingService.logScore(job, resource, score, scoreMessage + " scored by travel time");
                return score;
            } else {
                LoggingService.logScore(job, resource, -1L, "Could not find travel time");
                return -1L;
            }
        }
    }
}
`;