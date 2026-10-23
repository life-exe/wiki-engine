import { NavLink, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Lecture } from "../../types";
import { useWiki } from "../../context/WikiContext";
import { WikiIcon } from "../WikiIcon";
import {
  getCardActiveStyles,
  getCardInactiveStyles,
  getItemActiveStyles,
  getItemInactiveStyles,
  resolveCoverUrl,
} from "./navStyles";

export function LectureItem({
  lecture,
  sectionSlug,
  openLectures,
  onToggleLecture,
  depth = 1,
}: {
  lecture: Lecture;
  sectionSlug: string;
  openLectures: Set<string>;
  onToggleLecture: (key: string) => void;
  depth?: number;
}) {
  const { lang, data, getWikiUrl } = useWiki();
  const location = useLocation();
  const { lecture: activeLecture, slug: activeSlug } = useParams<{
    lecture?: string;
    section?: string;
    slug?: string;
  }>();
  const lTitle = lang === "en" && lecture.titleEn ? lecture.titleEn : lecture.title;
  const hasChildren = Boolean(lecture.children && lecture.children.length > 0);
  const lectureKey = lecture.page ? `${sectionSlug}/${lecture.page.slug}` : "";
  const isOpen = lectureKey ? openLectures.has(lectureKey) : false;

  const lectureUrl = lecture.page
    ? getWikiUrl(`${sectionSlug}/${lecture.page.slug}`)
    : `${getWikiUrl(sectionSlug)}#${lecture.anchorSlug}`;

  const isPathMatch = lecture.page ? location.pathname.replace(/\/+$/, "") === lectureUrl : false;
  const isHashMatch =
    !lecture.page &&
    location.pathname.replace(/\/+$/, "") === getWikiUrl(sectionSlug) &&
    location.hash === `#${lecture.anchorSlug}`;
  const isParamMatch = Boolean(
    lecture.page &&
    (activeLecture === lecture.page.slug ||
      activeLecture === lecture.number ||
      activeSlug === lecture.page.slug),
  );
  const isItemActive = isPathMatch || isHashMatch || isParamMatch;
  const iconName = lecture.icon ?? lecture.page?.icon;

  const isCourse = sectionSlug === "courses" || lecture.page?.parent === "courses";
  const coverRaw = isCourse
    ? (lecture.thumb ?? lecture.page?.thumb ?? lecture.cover ?? lecture.page?.cover)
    : undefined;
  const coverUrl = resolveCoverUrl(coverRaw, sectionSlug, data?.wikiImages);
  const hasCover = Boolean(coverUrl);

  return (
    <li>
      {hasChildren ? (
        <div
          className={`group flex items-center justify-between w-full transition-all duration-150 ${
            hasCover
              ? isItemActive
                ? getCardActiveStyles()
                : getCardInactiveStyles()
              : isItemActive
                ? getItemActiveStyles(depth)
                : getItemInactiveStyles(depth)
          }`}
        >
          <NavLink
            to={lectureUrl}
            onClick={
              lectureKey
                ? () => {
                    if (!isOpen) onToggleLecture(lectureKey);
                  }
                : undefined
            }
            className={`flex-1 min-w-0 transition-colors focus:outline-none ${
              hasCover
                ? "p-1.5 pr-1 flex items-center gap-2.5"
                : `py-1.5 px-2.5 text-sm truncate ${
                    isItemActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground group-hover:text-foreground"
                  } ${lecture.page ? "" : "opacity-60"}`
            }`}
          >
            {hasCover ? (
              <>
                <img
                  src={coverUrl}
                  alt=""
                  loading="lazy"
                  className="w-14 h-8 shrink-0 rounded-md object-cover border border-border/40 shadow-xs"
                />
                <span className="line-clamp-2 text-xs sm:text-[13px] leading-snug font-medium flex-1">
                  {lTitle}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2 min-w-0">
                {depth === 0 && <WikiIcon name={iconName} className="opacity-80 shrink-0" />}
                <span className="truncate">{lTitle}</span>
              </span>
            )}
          </NavLink>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (lectureKey) onToggleLecture(lectureKey);
            }}
            className="p-1 mr-1 shrink-0 cursor-pointer text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none"
          >
            <ChevronRight
              size={13}
              className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      ) : (
        <NavLink
          to={lectureUrl}
          className={({ isActive }) =>
            hasCover
              ? `flex items-center gap-2.5 w-full p-1.5 pr-2 transition-all duration-150 focus:outline-none ${
                  isActive || isItemActive ? getCardActiveStyles() : getCardInactiveStyles()
                } ${lecture.page ? "" : "opacity-60"}`
              : `flex items-center w-full px-2.5 py-1.5 text-sm transition-all duration-150 truncate focus:outline-none ${
                  isActive || isItemActive
                    ? getItemActiveStyles(depth)
                    : getItemInactiveStyles(depth)
                } ${lecture.page ? "" : "opacity-60"}`
          }
        >
          {hasCover ? (
            <>
              <img
                src={coverUrl}
                alt=""
                loading="lazy"
                className="w-14 h-8 shrink-0 rounded-md object-cover border border-border/40 shadow-xs"
              />
              <span className="line-clamp-2 text-xs sm:text-[13px] leading-snug font-medium flex-1">
                {lTitle}
              </span>
            </>
          ) : (
            <>
              {depth === 0 && <WikiIcon name={iconName} className="opacity-80 mr-2 shrink-0" />}
              <span className="truncate">{lTitle}</span>
            </>
          )}
        </NavLink>
      )}

      {hasChildren && isOpen && (
        <ul className="ml-3.5 border-l border-border mt-0.5 space-y-0.5">
          {lecture.children!.map((child: Lecture) => (
            <LectureItem
              key={child.anchorSlug}
              lecture={child}
              sectionSlug={sectionSlug}
              openLectures={openLectures}
              onToggleLecture={onToggleLecture}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
