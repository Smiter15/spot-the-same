import { useState, useEffect } from 'react';
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
    userId: string;
    guess: (card: Card, icon: number) => Promise<'red' | 'yellow' | 'green'>;
};

export default function PlayerCards({ gameId, userId, guess }: PlayerCardsProps) {
    const cards = useQuery(api.gameDetails.getPlayerCards, {
        gameId: gameId as Id<'games'>,
        userId: userId as Id<'users'>,
    });

    const [disabled, setDisabled] = useState(false);
    const [buttonColors, setButtonColors] = useState<string[]>([]);

    // Sync button colors when cards load
    useEffect(() => {
        if (cards && cards[0]) {
            setButtonColors(Array(cards[0].length).fill('white'));
        }
    }, [cards]);

    if (!cards || cards.length === 0) {
        return <Text style={styles.empty}>No cards left</Text>;
    }

    const handleGuess = async (card: Card, icon: number, i: number) => {
        setDisabled(true);
        const result = await guess(card, icon);

        const flashColors = [...buttonColors];
        flashColors[i] = result === 'red' ? '#FFC0CB' : result === 'yellow' ? '#FFFF99' : '#98FB98';

        setButtonColors(flashColors);

        setTimeout(() => {
            const resetColors = [...flashColors];
            resetColors[i] = 'white';
            setButtonColors(resetColors);
            setDisabled(false);
        }, 150);
    };

    return (
        <>
            <Text style={styles.cardsLeft}>Cards left: {cards.length}</Text>
            <View style={styles.playerIcons}>
                {cards[0].map((icon: number, i: number) => {
                    const Icon = (Icons as Record<string, React.ComponentType<any>>)[`Icon${icon}`];

                    return (
                        <Pressable
                            key={`player-card-${icon}-${i}`}
                            style={[styles.playerIcon, { backgroundColor: buttonColors[i] }]}
                            onPress={() => handleGuess(cards[0], icon, i)}
                            disabled={disabled}
                        >
                            {Icon ? <Icon width={iconWidth} height={60} /> : <Text style={styles.missing}>?</Text>}
                        </Pressable>
                    );
                })}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    playerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 16,
        gap: 8,
    },
    playerIcon: {
        borderWidth: 1,
        borderColor: '#ccc',
        width: iconContainerWidth,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    cardsLeft: {
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    },
    missing: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'red',
    },
});
