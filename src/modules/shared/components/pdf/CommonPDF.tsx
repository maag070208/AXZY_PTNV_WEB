import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const NAVY = "#1e3a5f";
const GOLD = "#c9a84c";
const WHITE = "#ffffff";
const SLATE = "#64748b";
const SLATE_LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";

export const commonStyles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  pageContent: {
    padding: 0,
  },
  headerBlock: {
    backgroundColor: NAVY,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  logoArea: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: GOLD,
    marginBottom: 2,
  },
  headerMeta: {
    fontSize: 8,
    color: SLATE_LIGHT,
    textAlign: "right",
    marginTop: 4,
  },
  headerDivider: {
    height: 2,
    backgroundColor: GOLD,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 50,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerLogo: {
    width: 10,
    height: 10,
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 7,
    color: SLATE_LIGHT,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerPowered: {
    fontSize: 7,
    color: GOLD,
  },
  footerDate: {
    fontSize: 7,
    color: SLATE_LIGHT,
    marginTop: 1,
  },
});

export const CommonHeader = ({
  title,
  subtitle,
  meta,
  pageNumber,
  totalPages,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  pageNumber: number;
  totalPages: number;
}) => (
  <View style={commonStyles.headerBlock}>
    <View style={commonStyles.headerTop}>
      <View style={commonStyles.logoArea}>
        <Text style={commonStyles.logoText}>Puerto Nuevo</Text>
        <Text style={commonStyles.logoSubtext}>Hotel & Villas</Text>
      </View>
      <View style={commonStyles.headerRight}>
        {pageNumber === 1 && subtitle && (
          <Text style={commonStyles.headerSubtitle}>{subtitle}</Text>
        )}
        <Text style={commonStyles.headerMeta}>
          {meta && `${meta}  ·  `}Página {pageNumber} de {totalPages}
        </Text>
      </View>
    </View>
    <View style={commonStyles.headerDivider} />
    {pageNumber === 1 && (
      <Text style={{ ...commonStyles.headerTitle, marginTop: 14 }}>{title}</Text>
    )}
  </View>
);

export const CommonFooter = () => (
  <View style={commonStyles.footer} fixed>
    <View style={commonStyles.footerLeft}>
      <View style={commonStyles.footerLogo} />
      <Text style={commonStyles.footerText}>Hotel Puerto Nuevo</Text>
    </View>
    <Text style={commonStyles.footerPowered}>powered by axzy.dev</Text>
  </View>
);
