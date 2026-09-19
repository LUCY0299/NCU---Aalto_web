// 共用區塊標題組件
// variant="page"：獨立頁面樣式（置中、字級較大）－預設值，確保現有頁面不用改就維持原樣
// variant="home"：首頁樣式（靠左、字級較小）
export default function SectionTitle({
    children,
    variant = "page",
    as = "h2",
    style = {},
}) {
    const variantStyles = {
        page: {
            fontSize: "clamp(32px, 5vw, 48px)",
            textAlign: "center",
            fontWeight: 700,
            lineHeight: 1.3,
        },
        home: {
            fontSize: "clamp(24px, 4vw, 40px)",
            textAlign: "left",
            fontWeight: 500,
            lineHeight: 1.3,
        },
    };

    const Tag = as;

    return (
        <Tag
            style={{
                margin: "0 0 16px 0",
                color: "#160D03",
                ...variantStyles[variant],
                ...style,
            }}
        >
            {children}
        </Tag>
    );
}
