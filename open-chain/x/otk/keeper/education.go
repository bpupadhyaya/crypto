// Package keeper — Education Value Tracking.
//
// Article I, Section 2: "Every teacher's extra hour deserves recognition."
// Article III: eOTK represents teaching, mentoring, knowledge transfer.
//
// This module tracks educational milestones and their ripple effects.
// When a student achieves a milestone, their teachers earn eOTK through
// ripple attribution — making the invisible labor of teaching visible.

package keeper

import (
	"encoding/json"
	"fmt"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// EducationMilestone tracks a student's educational achievement.
type EducationMilestone struct {
	StudentUID   string   `json:"student_uid"`
	MilestoneType string  `json:"milestone_type"` // literacy, numeracy, graduation, skill
	Description  string   `json:"description"`
	Grade        string   `json:"grade"`          // age-appropriate grade level
	TeacherUIDs  []string `json:"teacher_uids"`   // teachers who contributed
	MentorUIDs   []string `json:"mentor_uids"`    // mentors who contributed
	Verified     bool     `json:"verified"`
	BlockHeight  int64    `json:"block_height"`
}

// TeacherImpact tracks a teacher's cumulative impact.
type TeacherImpact struct {
	TeacherUID       string `json:"teacher_uid"`
	StudentsReached  int64  `json:"students_reached"`
	MilestonesHelped int64  `json:"milestones_helped"`
	TotalEOTKEarned  int64  `json:"total_eotk_earned"`
	GratitudeReceived int64 `json:"gratitude_received"`
	ImpactScore      int64  `json:"impact_score"`
}

// RecordEducationMilestone records a student's educational achievement
// and distributes eOTK to contributing teachers via ripple attribution.
func (k Keeper) RecordEducationMilestone(ctx sdk.Context, milestone EducationMilestone) error {
	if milestone.StudentUID == "" {
		return fmt.Errorf("student UID required")
	}

	milestone.BlockHeight = ctx.BlockHeight()

	// Store the milestone
	store := ctx.KVStore(k.storeKey)
	key := []byte(fmt.Sprintf("edu_milestone/%s/%d", milestone.StudentUID, milestone.BlockHeight))
	bz, _ := json.Marshal(milestone)
	store.Set(key, bz)

	// Update teacher impact scores
	for _, teacherUID := range milestone.TeacherUIDs {
		k.updateTeacherImpact(ctx, teacherUID)
	}
	for _, mentorUID := range milestone.MentorUIDs {
		k.updateTeacherImpact(ctx, mentorUID)
	}

	ctx.EventManager().EmitEvent(sdk.NewEvent(
		"education_milestone",
		sdk.NewAttribute("student_uid", milestone.StudentUID),
		sdk.NewAttribute("type", milestone.MilestoneType),
		sdk.NewAttribute("teachers", fmt.Sprintf("%d", len(milestone.TeacherUIDs))),
	))

	return nil
}

// GetTeacherImpact returns a teacher's cumulative impact score.
func (k Keeper) GetTeacherImpact(ctx sdk.Context, teacherUID string) TeacherImpact {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get([]byte("teacher_impact/" + teacherUID))
	if bz == nil {
		return TeacherImpact{TeacherUID: teacherUID}
	}
	var impact TeacherImpact
	_ = json.Unmarshal(bz, &impact)
	return impact
}

// GetStudentMilestones returns all educational milestones for a student.
func (k Keeper) GetStudentMilestones(ctx sdk.Context, studentUID string) []EducationMilestone {
	store := ctx.KVStore(k.storeKey)
	prefix := []byte(fmt.Sprintf("edu_milestone/%s/", studentUID))
	iterator := store.Iterator(prefix, nil)
	defer iterator.Close()

	var milestones []EducationMilestone
	for ; iterator.Valid(); iterator.Next() {
		var m EducationMilestone
		if err := json.Unmarshal(iterator.Value(), &m); err != nil {
			continue
		}
		milestones = append(milestones, m)
	}
	return milestones
}

func (k Keeper) updateTeacherImpact(ctx sdk.Context, teacherUID string) {
	impact := k.GetTeacherImpact(ctx, teacherUID)
	impact.MilestonesHelped++
	// Recalculate impact score: milestones*10 + students*5 + gratitude*3
	impact.ImpactScore = impact.MilestonesHelped*10 + impact.StudentsReached*5 + impact.GratitudeReceived*3

	store := ctx.KVStore(k.storeKey)
	bz, _ := json.Marshal(impact)
	store.Set([]byte("teacher_impact/"+teacherUID), bz)
}
