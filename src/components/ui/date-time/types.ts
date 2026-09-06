export type DateAmPmTimeFieldProps = {
    dateValue: string;
    timeValue: string;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    /** YYYY-MM-DD — days before this cannot be selected */
    minDate?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    dateLabel?: string;
    timeLabel?: string;
    inputClassName?: string;
};
