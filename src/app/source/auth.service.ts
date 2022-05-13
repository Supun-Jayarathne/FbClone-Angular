import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import firebase, { User } from 'firebase';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: Observable<firebase.User>;

  private currentUser: UserData;
  private currentUser$: BehaviorSubject<UserData> = new BehaviorSubject<UserData>(null);

  constructor(private afs: AngularFirestore,
    private afAuth: AngularFireAuth, private router: Router) {

    this.userData = afAuth.authState;

    this.userData.subscribe((user) => {
      if (user) {
        this.afs.collection<UserData>('users')
          .doc<UserData>(user.uid)
          .valueChanges()
          .subscribe(currentUser => {
            this.currentUser = currentUser;
            this.currentUser$.next(currentUser);
          });
      } else {
        this.currentUser = null;
        this.currentUser$.next(this.currentUser)
      }
    });
  }

  CurrentUser(): Observable<UserData> {
    return this.currentUser$.asObservable();
  }

  SignUp(email: string, password: string, firstName: string, lastName: string,
    avatar: string = 'https://portal.staralliance.com/cms/aux-pictures/prototype-images/avatar-default.png/@@images/image.png'): void {
    this.afAuth.createUserWithEmailAndPassword(email, password)
      .then(res => {
        console.log(res);
        if (res) {
          this.afs.collection('users').doc(res.user.uid)
            .set({
              firstName,
              lastName,
              email,
              avatar
            }).then(value => {
              this.afs.collection<UserData>('users')
                .doc<UserData>(res.user.uid)
                .valueChanges()
                .subscribe(user => {
                  console.log(user);
                  if (user) {
                    this.currentUser$.next(user);
                  }
                });

            });
        }
      })
      .catch(err => console.log(`Something went wrong ${err.message}`));
  }

  get UserData(): Observable<firebase.User> {
    return this.userData;
  }

  SignIn(email: string, password: string): void {
    this.afAuth.signInWithEmailAndPassword(email, password)
      .then(res => {
        console.log(res);
        this.userData = this.afAuth.authState;

        this.afs.collection<UserData>('users')
          .doc<UserData>(res.user.uid)
          .valueChanges()
          .subscribe((user) => {
            console.log(user);
            // @ts-ignore
            this.currentUser = user;
            this.currentUser$.next(this.currentUser);
          });


      }).catch(err => console.log(err.message));
  }

  Logout(): void {
    this.afAuth.signOut().then(res => {
      console.log(res);
      this.currentUser = null;
      this.currentUser$.next(this.currentUser);
      this.router.navigateByUrl('/login').then();
    });
  }

  searchUserInDatabase(user_id: string): Observable<UserData> {
    return this.afs.collection<UserData>('users').doc<UserData>(user_id).valueChanges();
  }
  

}

export interface UserData {
  fisrtName: string;
  lastName: string;
  avatar: string;
  email: string;
  id: string
}
