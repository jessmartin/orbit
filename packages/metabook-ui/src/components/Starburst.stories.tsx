import {
  boolean,
  button,
  number,
  select,
  text,
  withKnobs,
} from "@storybook/addon-knobs";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import seedrandom from "seedrandom";
import { colors } from "../styles";
import lerp from "../util/lerp";
import Starburst from "./Starburst";

export default {
  title: "Starburst",
  component: Starburst,
  decorators: [withKnobs],
};

function StarburstGrid(props: { diameter: number }) {
  const minCount = number("Min count", 5);
  const children = Array.from(
    new Array(number("Count", number("Max count", 120) - minCount)).keys(),
  ).map((i) => {
    const strokeCount = i + minCount;
    const entries = Array.from(new Array(strokeCount)).map(() => ({
      value: Math.random(),
      color: "black",
    }));
    return (
      <View key={i}>
        <Text>{strokeCount}</Text>
        <Starburst
          diameter={props.diameter}
          entries={entries}
          thickness={number("Thickness", 4)}
        />
      </View>
    );
  });
  return (
    <View style={{ flexWrap: "wrap", flexDirection: "row" }}>{children}</View>
  );
}

export function Sandbox() {
  const strokeCount = number("Line count", 25);
  const seed = text("Random seed", "seed");

  const minLength = number("Line min", 0);
  const maxLength = number("Line max", 1);

  const diameter = number("Size", 500);

  let colorComposition: typeof colors.palettes[0];
  let backgroundColor: string;
  let strokeColor: string;
  let accentColor: string;
  let completedStrokeColor: string;
  const colorRange = {
    min: 0,
    max: colors.palettes.length - 1,
    range: true,
    step: 1,
  };
  if (boolean("Use composition", true)) {
    colorComposition =
      colors.palettes[number("Color palette index", 0, colorRange)];
    backgroundColor = colorComposition.backgroundColor;
    const strokeSelection = select(
      "Incomplete stroke color",
      ["secondary", "tertiary", "accent", "ink", "black", "white"],
      "tertiary",
    );
    strokeColor = {
      secondary: colorComposition.secondaryColor,
      tertiary: colorComposition.tertiaryColor,
      accent: colorComposition.accentColor,
      ink: colors.ink,
      black: "black",
      white: colors.white,
    }[strokeSelection];

    const completedStrokeSelection = select(
      "Completed stroke color",
      ["secondary", "tertiary", "accent", "ink", "black", "white"],
      "secondary",
    );
    completedStrokeColor = {
      secondary: colorComposition.secondaryColor,
      tertiary: colorComposition.tertiaryColor,
      accent: colorComposition.accentColor,
      ink: colors.ink,
      black: "black",
      white: colors.white,
    }[completedStrokeSelection];

    const accentColorSelection = select(
      "Accent stroke color",
      ["secondary", "tertiary", "accent", "ink", "black", "white"],
      "accent",
    );
    accentColor = {
      secondary: colorComposition.secondaryColor,
      tertiary: colorComposition.tertiaryColor,
      accent: colorComposition.accentColor,
      ink: colors.ink,
      black: "black",
      white: colors.white,
    }[accentColorSelection];
  } else {
    const strokeColorSource = select(
      "Stroke color source",
      ["bg", "secondary", "shade", "ink", "white"],
      "shade",
    );
    const strokeColorIndex = number("Secondary color index", 1, colorRange);
    strokeColor = {
      bg: colors.palettes[strokeColorIndex].backgroundColor,
      secondary: colors.palettes[strokeColorIndex].secondaryColor,
      shade: colors.palettes[strokeColorIndex].tertiaryColor,
      ink: colors.ink,
      white: colors.white,
    }[strokeColorSource];

    const completedStrokeColorSource = select(
      "Completed stroke color source",
      ["bg", "secondary", "ink", "white"],
      "secondary",
    );
    const completedStrokeColorIndex = number(
      "Completed stroke color index",
      1,
      colorRange,
    );
    completedStrokeColor = {
      bg: colors.palettes[completedStrokeColorIndex].backgroundColor,
      secondary: colors.palettes[completedStrokeColorIndex].secondaryColor,
      ink: colors.ink,
      white: colors.white,
    }[completedStrokeColorSource];

    const accentStrokeColorSource = select(
      "Accent stroke color source",
      ["bg", "accent", "ink", "white"],
      "accent",
    );
    const accentStrokeColorIndex = number(
      "Accent stroke color index",
      1,
      colorRange,
    );
    accentColor = {
      bg: colors.palettes[accentStrokeColorIndex].backgroundColor,
      accent: colors.palettes[accentStrokeColorIndex].accentColor,
      ink: colors.ink,
      white: colors.white,
    }[accentStrokeColorSource];

    backgroundColor =
      colors.palettes[number("BG color index", 0, colorRange)].backgroundColor;
  }

  const [currentEntry, setCurrentEntry] = useState(0);
  // const currentEntry = number("Current entry number", 0);

  const [values, setLengths] = useState<number[]>([]);
  useEffect(() => {
    const rng = seedrandom(seed);
    setLengths(
      Array.from(new Array(strokeCount).keys()).map(() =>
        lerp(rng(), 0, 1, minLength, maxLength),
      ),
    );
  }, [maxLength, minLength, seed, strokeCount]);

  button("Change length", () => {
    setLengths((lengths) => {
      lengths[currentEntry] = Math.max(
        0,
        Math.min(1, lengths[currentEntry] + (Math.random() - 0.2) * 0.5),
      );
      return lengths;
    });
    const delay =
      currentEntry === 0 ? 500 : Math.max(0, 500 - currentEntry * 100);
    setTimeout(() => {
      setCurrentEntry((currentEntry) => currentEntry + 1);
    }, delay);
  });

  const entries = values.map((value, index) => ({
    value,
    color: index < currentEntry ? completedStrokeColor : strokeColor,
  }));

  const rotationDegrees = number("Extra rotation degrees", 0);

  const useOrigin = boolean("Use origin", false);
  const originX = number("Origin X", 0);
  const originY = number("Origin Y", 0);
  const origin = useOrigin ? ([originX, originY] as const) : undefined;

  return (
    <View
      style={{
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eee",
      }}
    >
      <View
        style={{
          backgroundColor: backgroundColor,
        }}
      >
        <View
          style={{
            transform: [
              { rotateZ: `${rotationDegrees}deg` },
              { scale: number("Scale", 1) },
              { translateX: number("Translate X", 0, { min: -100, max: 100 }) },
              { translateY: number("Translate Y", 0, { min: -100, max: 100 }) },
            ],
          }}
        >
          <Starburst
            diameter={diameter}
            entries={entries}
            thickness={number("Thickness", 4)}
            accentOverlayColor={accentColor}
            entryAtHorizontal={currentEntry}
            origin={origin}
          />
        </View>
      </View>
    </View>
  );
}

export function MediumSize() {
  return <StarburstGrid diameter={number("Diameter", 300)} />;
}

export function ReviewSize() {
  return <StarburstGrid diameter={number("Diameter", 700)} />;
}
