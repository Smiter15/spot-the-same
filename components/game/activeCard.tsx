import { StyleSheet, View, Dimensions } from 'react-native';

import Icons from '../../assets/icons';

const iconWidth = (Dimensions.get('window').width - 60) / 6;

const ActiveCard = ({ card }: { card: number[] }) => {
  return (
    <View style={styles.icons}>
      {card.map((icon: number) => {
        const Icon = (Icons as any)[`Icon${icon}`];

        return (
          <View key={`active-card-${icon}`} style={styles.icon}>
            <Icon width={iconWidth} height={60} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  icons: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  icon: {
    marginLeft: '15%',
    flexBasis: '35%',
    height: '33.33%',
    width: iconWidth,
  },
});

export default ActiveCard;
