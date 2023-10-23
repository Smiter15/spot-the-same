import { useState } from 'react';
import { StyleSheet, Pressable, View, Dimensions, Text } from 'react-native';
import { useQuery } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

import Icons from '../../assets/icons';

import { Card } from '../../types';

const iconContainerWidth = Dimensions.get('window').width / 6;
const iconWidth = (Dimensions.get('window').width - 60) / 6;

type PlayerCardsProps = {
  gameId: string;
  playerId: string;
  guess: (card: Card, icon: number) => Promise<'red' | 'yellow' | 'green'>;
};

const PlayerCards = ({ gameId, playerId, guess }: PlayerCardsProps) => {
  const cards = useQuery(api.gameDetails.getPlayerCards, {
    gameId: gameId as Id<'games'>,
    playerId: playerId as Id<'players'>,
  });

  const [disabled, setDisabled] = useState(false);
  const [buttonColors, setButtonColors] = useState(
    cards ? Array(cards[0].length).fill('white') : []
  );

  if (!cards || cards.length === 0) return null;

  const handleGuess = async (card: Card, icon: number, i: number) => {
    setDisabled(true);
    const result = await guess(card, icon);
    const flashButtonColors = [...buttonColors];

    if (result === 'red') {
      flashButtonColors[i] = '#FFC0CB';
    } else if (result === 'yellow') {
      flashButtonColors[i] = '#FFFF99';
    } else if (result === 'green') {
      flashButtonColors[i] = '#98FB98';
    }

    setButtonColors(flashButtonColors);

    setTimeout(() => {
      const resetButtonColors = [...flashButtonColors];
      resetButtonColors[i] = 'white';

      setButtonColors(resetButtonColors);
      setDisabled(false);
    }, 100);
  };

  return (
    <>
      <Text>Cards left: {cards.length}</Text>
      <View style={styles.playerIcons}>
        {cards[0].map((icon: number, i: number) => {
          const Icon = (Icons as any)[`Icon${icon}`];

          return (
            <Pressable
              key={`player-card-${icon}`}
              style={[styles.playerIcon, { backgroundColor: buttonColors[i] }]}
              onPress={() => handleGuess(cards[0], icon, i)}
              disabled={disabled}
            >
              <Icon width={iconWidth} height={60} />
            </Pressable>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  playerIcons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: 1,
    marginTop: 'auto',
  },
  playerIcon: {
    borderWidth: 1,
    width: iconContainerWidth,
    paddingLeft: 4,
    paddingTop: 20,
    paddingBottom: 50,
  },
});

export default PlayerCards;
