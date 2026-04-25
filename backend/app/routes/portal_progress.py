from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import Course, ProgressRecord
from ..utils.auth import login_required


portal_progress_bp = Blueprint("portal_progress", __name__)

ALLOWED_STATUS_FILTERS = {"completed", "in_progress", "not_started"}
ALLOWED_SORT_OPTIONS = {"progress", "title", "completed_at"}


def calculate_progress_percentage(completed_resources: int, total_resources: int):
    if total_resources == 0:
        return 0

    return round((completed_resources / total_resources) * 100, 2)


def evaluate_course_completion(total_resources: int, completed_resources: int):
    if total_resources == 0:
        return False

    return completed_resources == total_resources


def get_completed_progress_map_for_user(user_id: int):
    records = ProgressRecord.query.filter(
        ProgressRecord.user_id == user_id,
        ProgressRecord.completed_at.isnot(None),
    ).all()

    return {record.resource_id: record.completed_at for record in records}


def build_module_progress_summary(module, completed_progress_map):
    resources = list(module.resources)
    total_resources = len(resources)
    completed_resources = sum(
        1 for resource in resources if resource.id in completed_progress_map
    )

    return {
        "module_id": module.id,
        "module_title": module.title,
        "total_resources": total_resources,
        "completed_resources": completed_resources,
        "progress_percentage": calculate_progress_percentage(
            completed_resources, total_resources
        ),
    }


def build_course_progress_summary(course, completed_progress_map, include_modules=False):
    modules = list(course.modules)
    module_summaries = [
        build_module_progress_summary(module, completed_progress_map) for module in modules
    ]

    total_modules = len(modules)
    total_resources = sum(summary["total_resources"] for summary in module_summaries)
    completed_resources = sum(
        summary["completed_resources"] for summary in module_summaries
    )
    is_completed = evaluate_course_completion(total_resources, completed_resources)
    completed_at = None

    if is_completed:
        completed_timestamps = [
            completed_progress_map[resource.id]
            for module in modules
            for resource in module.resources
            if resource.id in completed_progress_map
        ]
        if completed_timestamps:
            completed_at = max(completed_timestamps)

    summary = {
        "course_id": course.id,
        "course_title": course.title,
        "total_modules": total_modules,
        "total_resources": total_resources,
        "completed_resources": completed_resources,
        "progress_percentage": calculate_progress_percentage(
            completed_resources, total_resources
        ),
        "is_completed": is_completed,
        "completed_at": completed_at.isoformat() if completed_at is not None else None,
    }

    if include_modules:
        summary["modules"] = module_summaries

    return summary


def filter_course_summaries(course_summaries, status_filter):
    if status_filter == "completed":
        return [summary for summary in course_summaries if summary["is_completed"]]

    if status_filter == "in_progress":
        return [
            summary
            for summary in course_summaries
            if 0 < summary["progress_percentage"] < 100
        ]

    if status_filter == "not_started":
        return [
            summary for summary in course_summaries if summary["completed_resources"] == 0
        ]

    return course_summaries


def sort_course_summaries(course_summaries, sort_option):
    if sort_option == "progress":
        return sorted(
            course_summaries,
            key=lambda summary: summary["progress_percentage"],
            reverse=True,
        )

    if sort_option == "title":
        return sorted(
            course_summaries,
            key=lambda summary: summary["course_title"].lower(),
        )

    if sort_option == "completed_at":
        completed = [
            summary for summary in course_summaries if summary["completed_at"] is not None
        ]
        not_completed = [
            summary for summary in course_summaries if summary["completed_at"] is None
        ]

        completed.sort(key=lambda summary: summary["completed_at"], reverse=True)
        return completed + not_completed

    return course_summaries


@portal_progress_bp.get("/portal/progress/overview")
@login_required
def get_portal_progress_overview():
    status_filter = request.args.get("status", type=str)
    sort_option = request.args.get("sort", type=str)

    if status_filter is not None:
        status_filter = status_filter.strip().lower()
        if status_filter not in ALLOWED_STATUS_FILTERS:
            return (
                jsonify({"status": "error", "message": "Invalid status filter."}),
                400,
            )

    if sort_option is not None:
        sort_option = sort_option.strip().lower()
        if sort_option not in ALLOWED_SORT_OPTIONS:
            return (
                jsonify({"status": "error", "message": "Invalid sort option."}),
                400,
            )

    completed_progress_map = get_completed_progress_map_for_user(g.current_user.id)
    courses = Course.query.order_by(Course.id).all()
    course_summaries = [
        build_course_progress_summary(course, completed_progress_map) for course in courses
    ]

    if status_filter is not None:
        course_summaries = filter_course_summaries(course_summaries, status_filter)

    if sort_option is not None:
        course_summaries = sort_course_summaries(course_summaries, sort_option)

    return (
        jsonify(
            {
                "status": "success",
                "courses": course_summaries,
            }
        ),
        200,
    )


@portal_progress_bp.get("/courses/<int:course_id>/progress-summary")
@login_required
def get_course_progress_summary(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return (
            jsonify({"status": "error", "message": "Course not found."}),
            404,
        )

    completed_progress_map = get_completed_progress_map_for_user(g.current_user.id)

    return (
        jsonify(
            {
                "status": "success",
                "course": build_course_progress_summary(
                    course,
                    completed_progress_map,
                    include_modules=True,
                ),
            }
        ),
        200,
    )
